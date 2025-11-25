// controllers/projectController.js

import projectService from "../services/projectService.js";
import { success } from "../utils/response.js";
import { startMockAoiPipeline } from "../services/mockpipelineservice.js";

/**
 * Create a new project
 * @route POST /projects
 * @body { name: string, description: string }
 * @returns Newly created project object
 */
const createProject = async (req, res, next) => {
  try {
    const newProject = await projectService.createProject(req.body);
    return success(res, "Project created successfully", newProject, 201);
  } catch (err) {
    console.log("Error in create project:", err.message);
    next(err);
  }
};

/**
 * Update an existing project
 * @route PUT /projects/:projectId
 * @params projectId - UUID of the project to update
 * @body Fields to update (name, description, etc.)
 * @returns Updated project object
 */
const updateProject = async (req, res, next) => {
  try {
    const updatedProject = await projectService.updateProject(
      req.params.projectId,
      req.body
    );
    return success(res, "Project updated successfully", updatedProject);
  } catch (err) {
    console.log("Error in update project:", err.message);
    next(err);
  }
};

/**
 * Delete a project
 * @route DELETE /projects/:projectId
 * @params projectId - UUID of the project to delete
 * @returns Success message
 */
const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.projectId);
    return success(res, "Project deleted successfully", null);
  } catch (err) {
    console.log("Error in delete project", err.message);

    next(err);
  }
};

/**
 * Fetch all projects
 * @route GET /projects
 * @returns Array of all projects
 */
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getAllProjects();
    return success(res, "Projects fetched successfully", projects);
  } catch (err) {
    console.log("Error in get all projects:", err.message);
    next(err);
  }
};

/**
 * Fetch a single project by ID
 * @route GET /projects/:projectId
 * @params projectId - UUID of the project to fetch
 * @returns Project object
 */
const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.projectId);
    return success(res, "Project fetched successfully", project);
  } catch (err) {
    console.log("Error in get project:", err.message);
    next(err);
  }
};

/**
 * Create a polygon for a project
 * @route POST /projects/polygon
 * @body { project_id: UUID, geom: GeoJSON Polygon, ... }
 * @returns Newly created polygon object
 */
const createProjectPolygon = async (req, res, next) => {
  try {
    const polygon = await projectService.createProjectPolygon(req.body);
    return success(res, "Project polygon created successfully", polygon, 201);
  } catch (err) {
    console.log("Error in create project polygon:", err.message);
    next(err);
  }
};

/**
 * Update a project polygon
 * @route PUT /projects/polygon/:polygonId
 * @params polygonId - UUID of the polygon to update
 * @body Fields to update (geom, etc.)
 * @returns Updated polygon object
 */
const updateProjectPolygon = async (req, res, next) => {
  try {
    const updatedPolygon = await projectService.updateProjectPolygon(
      req.params.polygonId,
      req.body
    );
    return success(
      res,
      "Project polygon updated successfully",
      updatedPolygon
    );
  } catch (err) {
    console.log("Error in update project polygon:", err.message);
    next(err);
  }
};

/**
 * Delete a project polygon
 * @route DELETE /projects/polygons/:polygonId
 * @params polygonId - UUID of the polygon to delete
 * @returns Success message
 */
const deleteProjectPolygon = async (req, res, next) => {
  try {
    await projectService.deleteProjectPolygon(req.params.polygonId);
    return success(res, "Project polygon deleted successfully", null);
  } catch (err) {
    console.log("Error in delete project polygon:", err.message);
    next(err);
  }
};

/**
 * Fetch all polygons of a specific project
 * @route GET /projects/:projectId/polygons
 * @params projectId - UUID of the project
 * @returns Array of polygons for the project
 */
const getPolygonsByProject = async (req, res, next) => {
  try {
    const polygons = await projectService.getPolygonsByProject(
      req.params.projectId
    );
    return success(res, "Project polygons fetched successfully", polygons);
  } catch (err) {
    console.log("Error in get polygons by project:", err.message);
    next(err);
  }
};
/** * Set AOI for a project
 * @route POST /projects/set-aoi/:projectId
 * @params projectId - UUID of the project
 * @returns Updated project object with AOI set
 */
const setProjectAoi = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const updatedProject = await projectService.setProjectAoi(projectId);
    return success(res, "Project AOI set successfully", updatedProject);
  } catch (err) {
    console.log("Error in set project AOI:", err.message);
    next(err);
  }
}

/**
 * MOCK: Set AOI pipeline
 * @route POST /projects/mock-set-aoi/:projectId
 * Kicks off a mock AOI pipeline and returns pipelineId immediately.
 */
const setProjectMockAoi = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const io = req.app.get("socket");

    console.log("[CONTROLLER] /mock-set-aoi called for project:", projectId);

    const { pipelineId } = await startMockAoiPipeline({ projectId, io });

    return success(res, "Mock AOI pipeline started", {
      pipelineId,
      projectId,
    });
  } catch (err) {
    console.log("Error in setProjectAoi (mock pipeline):", err.message);
    next(err);
  }
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
  setProjectAoi,
  setProjectMockAoi,
};
