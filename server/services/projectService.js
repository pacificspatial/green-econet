import { Op } from "sequelize";
import { ProjectPolygons, Projects } from "../db/models/index.js";
import CustomError from "../utils/customError.js";
import { calcArea, calcPerimeter, toGeography } from "../utils/geoUtil.js";
import { reorderPolygonIndexes } from "../utils/reorderPolygonIndexes.js";

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
    geom: toGeography(geom),
    area_m2: calcArea(geom),
    perimeter_m: calcPerimeter(geom),
  });

  return polygon;
};

/**
 * Update a project polygon
 */
const updateProjectPolygon = async (polygonId, updateData) => {
  const polygon = await ProjectPolygons.findByPk(polygonId);
  if (!polygon) {
    throw new CustomError("Project polygon not found", 404, "PROJECT_POLYGON_NOT_FOUND");
  }

  if (updateData.geom) {
    const geojson = updateData.geom; 

    updateData.geom = toGeography(geojson);
    updateData.area_m2 = calcArea(geojson);
    updateData.perimeter_m = calcPerimeter(geojson);
  }
  await polygon.update(updateData, { returning: true });
  return polygon;
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

export default {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProject,
  createProjectPolygon,
  updateProjectPolygon,
  deleteProjectPolygon,
  getPolygonsByProject
};
