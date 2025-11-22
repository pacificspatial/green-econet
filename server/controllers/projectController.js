import projectService from "../services/projectService.js";
import { success } from "../utils/response.js";

const createProject = async (req, res, next) => {
  try {
    const newProject = await projectService.createProject(req.body);
    return success(res, "Project created successfully", newProject, 201);
  } catch (err) {
    console.log("Error in create project:", err.message);
    next(err);
  }
};

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
}

const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.projectId);
    return success(res, "Project deleted successfully", null);
  } catch (err) {
    console.log("Error in delete project", err.message);
    
    next(err);
  }
};

const getAllProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getAllProjects();
    return success(res, "Projects fetched successfully", projects);
  } catch (err) {
    console.log("Error in get all projects:", err.message);
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.projectId);
    return success(res, "Project fetched successfully", project);
  } catch (err) {
    console.log("Error in get project:", err.message);
    next(err);
  }
};

const createProjectPolygon = async (req, res, next) => {
  try {
    const polygon = await projectService.createProjectPolygon(req.body);
    return success(res, "Project polygon created successfully", polygon, 201);
  } catch (err) {
    console.log("Error in create project polygon:", err.message);
    next(err);
  }
};

const updateProjectPolygon = async (req, res, next) => {
  try {
    const updatedPolygon = await projectService.updateProjectPolygon(
      req.params.polygonId,
      req.body
    );
    return success(res, "Project polygon updated successfully", updatedPolygon);
  } catch (err) {
    console.log("Error in update project polygon:", err.message);
    next(err);
  }
};

const deleteProjectPolygon = async (req, res, next) => {
  try {
    await projectService.deleteProjectPolygon(req.params.polygonId);
    return success(res, "Project polygon deleted successfully", null);
  } catch (err) {
    console.log("Error in delete project polygon:", err.message);
    next(err);
  }
};

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

