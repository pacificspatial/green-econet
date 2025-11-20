import { Project } from "@/types/ProjectData";
import axiosInstance from "./axiosInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Geometry } from "@/types/Region";
import { SimulationManualData } from "@/types/SimulationManualData";
import { ApiError } from "@/types/Error";

interface AddProjectPayload {
  project: Project;
  socketId?: string;
}
interface DeleteProjectPayload {
  cartodb_id: string;
  socketId?: string;
}

// Async Thunks
export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/projects");
      return response.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("fetchProjectsFailed");
    }
  }
);

export const addProject = createAsyncThunk(
  "projects/create",
  async ({ project, socketId }: AddProjectPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/projects", {
        ...project,
        clientId: socketId,
      });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const errorMessage =
        err?.response?.data?.errorCode || "serverErrorMessage";
      console.error("Project creation failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async (
    { cartodb_id, projectData }: { cartodb_id: string; projectData: Project },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(
        `/projects/${cartodb_id}`,
        projectData
      );
      return response.data.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const errorMessage =
        err?.response?.data?.errorCode || "serverErrorMessage";
      console.error("Project updating failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const removeProject = createAsyncThunk(
  "projects/delete",
  async (
    { cartodb_id, socketId }: DeleteProjectPayload,
    { rejectWithValue }
  ) => {
    try {
      await axiosInstance.delete(`/projects/${cartodb_id}`, {
        data: { clientId: socketId },
      });
      return cartodb_id;
    } catch (error) {
      console.log(error);
      return rejectWithValue("deleteProjectFailed");
    }
  }
);

interface DraftAoi {
  project_id: string;
  geom: Geometry;
  aoi_type: number;
  region_id?: string;
}

export const draftAoi = async ({
  project_id,
  geom,
  aoi_type,
  region_id,
}: DraftAoi) => {
  const response = await axiosInstance.put(
    `/projects/${project_id}/aoi/draft`,
    { geom, aoi_type, region_id }
  );
  return response.data;
};

export const fetchDraftAoi = async (
  project_id: string,
  aoi_type: number,
  usageType: string
) => {
  const response = await axiosInstance.get(
    `/projects/${project_id}/aoi/${aoi_type}?usageType=${usageType}`
  );
  return response.data;
};

export const removeAoi = async (
  project_id: string,
  data: { aoi_type: number; regionId?: number }
) => {
  const response = await axiosInstance.put(`/projects/${project_id}/aoi`, data);
  return response.data;
};

export const saveAoi = async (
  project_id: string,
  data: { aoi_type: number; usage_type: string }
) => {
  const response = await axiosInstance.put(
    `/projects/${project_id}/aoi/save`,
    data
  );
  return response.data;
};

export const fetchSavedAoiThunk = createAsyncThunk(
  "savedAoi/fetchSavedAoi",
  async (projectId: string) => {
    try {
      const response = await axiosInstance.get(
        `/projects/${projectId}/saved-aoi`
      );
      if (response.data.success) {
        return response.data.data[0];
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
);

export const getShapes = createAsyncThunk(
  "shapes/fetchShapes",
  async (project_id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/projects/${project_id}/shapes`
      );
      return response.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("fetchShapeFailed");
    }
  }
);

export const addShape = createAsyncThunk(
  "shapes/addShape",
  async (
    addShapeData: { project_id: string; shapeData: SimulationManualData },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        `/projects/${addShapeData.project_id}/shapes`,
        { shape: addShapeData.shapeData }
      );
      return response.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("addShapeFailed");
    }
  }
);

export const updateShape = createAsyncThunk(
  "shapes/updateShape",
  async (
    updateShapeData: { project_id: string; shape_id: string; geom: Geometry },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(
        `/projects/${updateShapeData.project_id}/shapes/${updateShapeData.shape_id}`,
        { geom: updateShapeData.geom }
      );
      return response.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("updateShapeFailed");
    }
  }
);

export const deleteShape = createAsyncThunk(
  "shapes/deleteShape",
  async (
    deleteShapeData: { project_id: string; shape_id: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.delete(
        `/projects/${deleteShapeData.project_id}/shapes/${deleteShapeData.shape_id}`
      );
      return response.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue("deleteShapeFailed");
    }
  }
);

export const getLocationArea = async (project_id: string) => {
  const response = await axiosInstance.get(
    `/projects/${project_id}/location-area`
  );
  return response.data;
};
