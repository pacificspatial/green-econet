import type { ProjectParam, ProjectPolygonParam } from "@/types/ApiHandlers";
import axiosInstance from "./axiosInstance";
import type { Geometry } from "geojson";

// =========================
// PROJECT CRUD
// =========================

// Create a new project
export const createProject = async (data: ProjectParam) => {
  const res = await axiosInstance.post("/projects", data);
  return res.data;
};

// Update project
export const updateProject = async (projectId: string, data: ProjectParam) => {
  const res = await axiosInstance.patch(`/projects/${projectId}`, data);
  return res.data;
};

// Delete project
export const deleteProject = async (projectId: string) => {
  const res = await axiosInstance.delete(`/projects/${projectId}`);
  return res.data;
};

// Get all projects
export const getAllProjects = async () => {
  const res = await axiosInstance.get("/projects");
  return res.data;
};

// Get single project by ID
export const getProject = async (projectId: string) => {
  const res = await axiosInstance.get(`/projects/${projectId}`);
  return res.data;
};

// =========================
// PROJECT POLYGONS CRUD
// =========================

// Create polygon for project
export const createProjectPolygon = async (data: ProjectPolygonParam) => {
  const res = await axiosInstance.post("/projects/polygon", data);
  return res.data;
};

// Update polygon
export const updateProjectPolygon = async (polygonId: string, geom: Geometry) => {
  const res = await axiosInstance.patch(`/projects/polygon/${polygonId}`, geom);
  return res.data;
};

// Delete polygon
export const deleteProjectPolygon = async (polygonId: string) => {
  const res = await axiosInstance.delete(`/projects/polygon/${polygonId}`);
  return res.data;
};

// Get all polygons under a project
export const getPolygonsByProject = async (projectId: string) => {
  const res = await axiosInstance.get(`/projects/${projectId}/polygon`);
  return res.data;
};

// Set AOI for a project
export const setProjectAoi = async (projectId: string) => {
  const res = await axiosInstance.post(`/projects/:${projectId}/process/run`);
  return res.data;
};