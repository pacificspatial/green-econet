// features/projectSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchProjects,
  addProject,
  updateProject,
  removeProject,
} from "@/api/project";
// import { Project } from "@/types/ProjectData";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { UsageType } from "@/types/UsageType";
import { usageTypes } from "@/constants/usageTypes";

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  currentProject: Project | null;
  currentUsageType: UsageType | null;
}

export interface Project {
  project_id?: string;
  name: string;
  usage_type: string;
  description: string;
  date_created?: string;
  date_modified?: string;
  owner?: string;
  note: string;
  aoi_type?: number;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
  currentProject: null,
  currentUsageType: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearProjects: () => {
      return initialState;
    },
    addProjectDirect(state, action: PayloadAction<Project>) {
      state.projects.unshift(action.payload);
    },
    removeProjectDirect: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(
        (p) => p.project_id != action.payload
      );
    },
    setCurrentProject(state, action: PayloadAction<Project | null>) {
      state.currentProject = action.payload;
      if (action.payload?.usage_type) {
        state.currentUsageType = usageTypes[action.payload?.usage_type];
      } else {
        state.currentUsageType = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Projects
    builder.addCase(fetchProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchProjects.fulfilled,
      (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.projects = action.payload;
      }
    );
    builder.addCase(fetchProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Project
    builder.addCase(addProject.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      addProject.fulfilled,
      (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.projects.unshift(action.payload);
      }
    );
    builder.addCase(addProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Project
    builder.addCase(updateProject.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      updateProject.fulfilled,
      (state, action: PayloadAction<Project>) => {
        state.loading = false;
        const index = state.projects.findIndex(
          (p) => p.project_id === action.payload.project_id
        );
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      }
    );
    builder.addCase(updateProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Remove Project
    builder.addCase(removeProject.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      removeProject.fulfilled,
      (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.projects = state.projects.filter(
          (p) => p.project_id !== action.payload
        );
      }
    );
    builder.addCase(removeProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

const persistConfig = {
  key: "projects",
  storage,
  whitelist: ["projects"], // Only persist the projects array
};

// Create persisted reducer
const persistedProjectReducer = persistReducer(
  persistConfig,
  projectSlice.reducer
);

export const {
  clearError,
  clearProjects,
  addProjectDirect,
  removeProjectDirect,
  setCurrentProject,
} = projectSlice.actions;
export default persistedProjectReducer;
export type { ProjectState };
