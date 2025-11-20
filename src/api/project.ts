import { Project } from "@/types/ProjectData";
import axiosInstance from "./axiosInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";
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
