import * as projectService from "../services/projectService.js";
// import { sendEmail } from "../services/awsSesService.js";

const createProject = async (req, res, next) => {
  try {
    const newProject = await projectService.createProject(req, res);
    res.status(201).json(newProject);
    // sendEmail(req);
  } catch (err) {
    next(err);
  }
};

const listProjects = async (req, res, next) => {
  try {
    const projects = await projectService.listProjects(req);
    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const updatedProject = await projectService.updateProject(
      req.params.cartodb_id,
      req.body
    );
    res.status(200).json(updatedProject);
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const response = await projectService.deleteProject(
      req.params.cartodb_id,
      req.body.clientId,
      req.app.get("socket")
    );
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const addAoi = async (req, res, next) => {
  try {
    const aoiShape = await projectService.addAoi(
      req.params.project_id,
      req.body
    );
    res.status(201).json(aoiShape);
  } catch (err) {
    next(err);
  }
};

const saveAoi = async (req, res, next) => {
  try {
    const aoiShape = await projectService.saveAoi(
      req.params.project_id,
      req.body
    );
    res.status(201).json(aoiShape);
  } catch (err) {
    next(err);
  }
};

const getAoi = async (req, res, next) => {
  try {
    const response = await projectService.getAoi(
      req.params.project_id,
      req.params.aoi_type,
      req.query.usageType
    );
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const getSavedAoi = async (req, res, next) => {
  try {
    const response = await projectService.getSavedAoi(req.params.project_id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const removeAoi = async (req, res, next) => {
  try {
    const { aoi_type, regionId } = req.body;
    const response = await projectService.removeAoi(
      req.params.project_id,
      aoi_type,
      regionId
    );
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

// shapes section
const addShape = async (req, res, next) => {
  try {
    const shape = await projectService.addShape(
      req.params.project_id,
      req.body.shape
    );
    res.status(201).json(shape);
  } catch (err) {
    next(err);
  }
};

const getShapes = async (req, res, next) => {
  try {
    const response = await projectService.getShapes(req.params.project_id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const updateShape = async (req, res, next) => {
  try {
    const { project_id, shape_id } = req.params;
    const { geom } = req.body;

    const response = await projectService.updateShape(
      project_id,
      shape_id,
      geom
    );

    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error updating shape:", error.message);
    next(error);
  }
};

const deleteShape = async (req, res, next) => {
  try {
    const { project_id, shape_id } = req.params;

    const response = await projectService.deleteShape(project_id, shape_id);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error deleting shape:", error.message);
    next(error);
  }
};

const getLocationArea = async (req, res, next) => {
  try {
    const response = await projectService.getLocationArea(
      req.params.project_id
    );
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export default {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  addAoi,
  getAoi,
  removeAoi,
  saveAoi,
  getSavedAoi,
  addShape,
  getShapes,
  updateShape,
  deleteShape,
  getLocationArea,
};

