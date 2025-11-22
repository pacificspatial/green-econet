import { ProjectPolygons, Projects } from "../db/models/index.js";
import { calcArea, calcPerimeter, toGeography } from "../utils/geoUtil.js";
import { reorderPolygonIndexes } from "../utils/reorderPolygonIndexes.js";

// Project Service
const createProject = async ({ name, description }) => {
  try {
    const project = await Projects.create({
      name,
      description,
    });
    
    return project;
  } catch (error) {
    console.log("Error in creating project", error.message);
    throw error;
  }
};

const updateProject = async (projectId, updateData) => {
  try {
    const project = await Projects.findByPk(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    await project.update(updateData);
    return project;
  } catch (error) {
    console.log("Error in updating project", error.message);
    throw error;
  }
};

const deleteProject = async (projectId) => {
  try {
    const project = await Projects.findByPk(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    await project.destroy();
  } catch (error) {
    console.log("Error in deleting project", error.message);
    throw error;
  }
};

const getAllProjects = async () => {
  try {
    const projects = await Projects.findAll({ raw: true });    
    return projects;
  } catch (error) {
    console.log("Error in fetching projects", error.message);
    throw error;
  }
};

const getProject = async (projectId) => {
  try {
    const project = await Projects.findByPk(projectId, { raw: true });
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  } catch (error) {
    console.log("Error in fetching project", error.message);
    throw error;
  }
};

// Project Polygon Service
const createProjectPolygon = async ({ projectId, geom, }) => {
  try {
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
  } catch (error) {
    console.log("Error creating project polygon", error.message);
    throw error;
  }
};

const updateProjectPolygon = async (polygonId, updateData) => {
  try {
    const polygon = await ProjectPolygons.findByPk(polygonId);
    if (!polygon) {
      throw new Error("Project polygon not found");
    }

    if (updateData.geom) {
      const geojson = updateData.geom; 

      updateData.geom = toGeography(geojson);
      updateData.area_m2 = calcArea(geojson);
      updateData.perimeter_m = calcPerimeter(geojson);
    }
    await polygon.update(updateData, { returning: true });
    return polygon;
  } catch (error) {
    console.log("Error updating project polygon", error.message);
    throw error;
  }
};

const deleteProjectPolygon = async (polygonId) => {
  try {
    const polygon = await ProjectPolygons.findByPk(polygonId);
    if (!polygon) {
      throw new Error("Project polygon not found");
    }

    const projectId = polygon.project_id;
    const deletedIndex = polygon.polygon_index;

    await polygon.destroy();

    // Reorder after delete
    await reorderPolygonIndexes(projectId, deletedIndex);
  } catch (error) {
    console.log("Error deleting project polygon", error.message);
    throw error;
  }
};

const getPolygonsByProject = async (projectId) => {
  try {
    const result = await ProjectPolygons.findAndCountAll({
      where: { project_id: projectId },
      order: [["polygon_index", "ASC"]],
      raw: true
    });

    return {
      total: result.count,
      polygons: result.rows
    };
  } catch (error) {
    console.log("Error fetching polygons by project", error.message);
    throw error;
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
