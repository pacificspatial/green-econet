import { ProjectPolygons, Projects } from "../db/models/index.js";
import CustomError from "../utils/customError.js";
import { calcArea, calcPerimeter, toGeography } from "../utils/geoUtil.js";
import { reorderPolygonIndexes } from "../utils/reorderPolygonIndexes.js";

// Project Service
const createProject = async ({ name, description }) => {
  const project = await Projects.create({
    name,
    description,
  });
  
  return project;
};

const updateProject = async (projectId, updateData) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  await project.update(updateData);
  return project;throw error;
};

const deleteProject = async (projectId) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  await project.destroy();
};

const getAllProjects = async () => {
  const projects = await Projects.findAll({ raw: true });    
  return projects;
};

const getProject = async (projectId) => {
  const project = await Projects.findByPk(projectId, { raw: true });
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  return project;
};

// Project Polygon Service
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
