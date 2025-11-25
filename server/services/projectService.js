import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { ProjectPolygons, Projects } from "../db/models/index.js";
import CustomError from "../utils/customError.js";
import { calcArea, calcPerimeter, toGeometry } from "../utils/geoUtil.js";
import { reorderPolygonIndexes } from "../utils/reorderPolygonIndexes.js";

// 1 validation + 5 query stages
const MOCK_AOI_STAGES = [
  { key: "VALIDATE_AOI", label: "Validating AOI configuration" },   // stage 1
  { key: "QUERY_1",      label: "Running AOI query 1" },           // stage 2
  { key: "QUERY_2",      label: "Running AOI query 2" },           // stage 3
  { key: "QUERY_3",      label: "Running AOI query 3" },           // stage 4
  { key: "QUERY_4",      label: "Running AOI query 4" },           // stage 5
  { key: "QUERY_5",      label: "Running AOI query 5" },           // stage 6
];

/**
 * Create a new project
 */
const createProject = async ({ name, description }) => {
  const existing = await Projects.findOne({ where: { name } });
  if (existing) {
    throw new CustomError("Project name already exists", 400, "PROJECT_NAME_DUPLICATE");
  }
  const project = await Projects.create({
    name,
    description,
  });
  
  return project;
};

/**
 * Update an existing project
 */
const updateProject = async (projectId, updateData) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  if (updateData.name) {
    const existing = await Projects.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: projectId } 
      }
    });

    if (existing) {
      throw new CustomError("Project name already exists", 400, "PROJECT_NAME_DUPLICATE");
    }
  }
  await project.update(updateData);
  return project;throw error;
};

/**
 * Delete a project
 */
const deleteProject = async (projectId) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  await project.destroy();
};

/**
 * Fetch all projects
 */
const getAllProjects = async () => {
  const projects = await Projects.findAll({ raw: true });    
  return projects;
};

/**
 * Fetch a project by ID
 */
const getProject = async (projectId) => {
  const project = await Projects.findByPk(projectId, { raw: true });
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  return project;
};

/**
 * Create a polygon for a project
 */
const createProjectPolygon = async ({ projectId, geom, }) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }

  const existing = await ProjectPolygons.findOne({
    where: { project_id: projectId },
    order: [["polygon_index", "DESC"]],
  });

  const nextIndex = existing ? existing.polygon_index + 1 : 0;

  const polygon = await ProjectPolygons.create({
    project_id: projectId,
    polygon_index: nextIndex,
    geom: toGeometry(geom),
    area_m2: calcArea(geom),
    perimeter_m: calcPerimeter(geom),
  });

  return polygon;
};

/**
 * Update a project polygon
 */
const updateProjectPolygon = async (polygonId, geom) => {
  const polygon = await ProjectPolygons.findByPk(polygonId);
  if (!polygon) {
    throw new CustomError(
      "Project polygon not found",
      404,
      "PROJECT_POLYGON_NOT_FOUND"
    );
  }

  // Build proper update payload
  const updatePayload = {
    geom: toGeometry(geom),
    area_m2: calcArea(geom),
    perimeter_m: calcPerimeter(geom),
  };

  const updated = await polygon.update(updatePayload);

  await updated.reload();
  return updated;
};


/**
 * Delete a project polygon and reorder indexes
 */
const deleteProjectPolygon = async (polygonId) => {
  const polygon = await ProjectPolygons.findByPk(polygonId);
  if (!polygon) {
    throw new CustomError("Project polygon not found", 404, "PROJECT_POLYGON_NOT_FOUND");
  }

  const projectId = polygon.project_id;
  const deletedIndex = polygon.polygon_index;

  await polygon.destroy();

  // Reorder after delete
  await reorderPolygonIndexes(projectId, deletedIndex);
};

/**
 * Get all polygons for a project along with count
 */
const getPolygonsByProject = async (projectId) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  const result = await ProjectPolygons.findAndCountAll({
    where: { project_id: projectId },
    order: [["polygon_index", "ASC"]],
    raw: true
  });

  return {
    total: result.count,
    polygons: result.rows
  };
};




/**
 * Start a mock AOI pipeline for Set AOI.
 * - 6 stages: 1 validation + 5 "query" stages
 * - Failure simulation controlled via env:
 *     AOI_MOCK_SIMULATE_FAILURE=true|false
 * - Emits:
 *     aoi:pipeline_started
 *     aoi:pipeline_stage
 *     aoi:pipeline_completed
 */
const startMockAoiPipeline = async ({ projectId, io }) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }

  const pipelineId = uuidv4();
  const totalSteps = MOCK_AOI_STAGES.length;

  // env flag to control failure simulation
  const simulateFailure = (process.env.AOI_MOCK_SIMULATE_FAILURE || "false") === "true";

  const emit = (event, payload) => {
    if (!io) {
      console.warn("Socket.IO instance not found on app; cannot emit:", event);
      return;
    }
    io.emit(event, payload);
  };

  emit("aoi:pipeline_started", {
    pipelineId,
    projectId,
    totalSteps,
    startedAt: new Date().toISOString(),
  });

  let succeeded = 0;
  let failed = 0;

  MOCK_AOI_STAGES.forEach((stage, index) => {
    const delayMs = (index + 1) * 2000; // 2s between stages – tweak if needed

    setTimeout(() => {
      let status = "success";

      // For mock: if simulateFailure=true, fail exactly one middle "query" stage (e.g. QUERY_2)
      if (simulateFailure && stage.key === "QUERY_2") {
        status = "failed";
        failed += 1;
      } else {
        succeeded += 1;
      }

      emit("aoi:pipeline_stage", {
        pipelineId,
        projectId,
        stageKey: stage.key,
        label: stage.label,
        status,                // "success" | "failed"
        step: index + 1,       // 1..6
        totalSteps,
        timestamp: new Date().toISOString(),
      });

      if (index === totalSteps - 1) {
        const overallStatus =
          failed === 0 ? "success" : succeeded === 0 ? "failed" : "partial_failure";

        emit("aoi:pipeline_completed", {
          pipelineId,
          projectId,
          status: overallStatus,
          summary: {
            totalSteps,
            succeeded,
            failed,
          },
          completedAt: new Date().toISOString(),
        });
      }
    }, delayMs);
  });

  // return immediately; pipeline continues in background
  return { pipelineId };
};


export default {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProject,
  createProjectPolygon,
  updateProjectPolygon,
  deleteProjectPolygon,
  getPolygonsByProject,
  startMockAoiPipeline,
};
