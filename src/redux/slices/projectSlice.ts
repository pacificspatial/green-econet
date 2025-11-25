import type { Geometry } from 'geojson';
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  processed: boolean;
  geom?: Geometry
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload.map(p => ({
        ...p,
        processed: p.processed ?? false,
      }));
    },

    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift({
        ...action.payload,
        processed: action.payload.processed ?? false,
      });
    },

    updateProjectById: (state, action: PayloadAction<Project>) => {
      state.projects = state.projects.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
    },

    deleteProjectById: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(
        (p) => p.id !== action.payload
      );
    },

    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
  },
});

export const {
  setProjects,
  addProject,
  updateProjectById,
  deleteProjectById,
  setSelectedProject,
} = projectSlice.actions;

export default projectSlice.reducer;
