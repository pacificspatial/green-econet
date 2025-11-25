import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type AoiRunStatus = "idle" | "running" | "success" | "partial_failure" | "failed";

export interface AoiStage {
  stageKey: string;
  label: string;
  status: "pending" | "success" | "failed";
  step: number;
  totalSteps: number;
}

export interface ProjectAoiStatus {
  totalSteps: number;
  projectId: string;
  pipelineId: string;
  status: AoiRunStatus;
  stages: AoiStage[];
  startedAt?: string;
  completedAt?: string;
}

interface AoiPipelineState {
  byProjectId: Record<string, ProjectAoiStatus>;
}

const initialState: AoiPipelineState = {
  byProjectId: {},
};

const aoiPipelineSlice = createSlice({
  name: "aoiPipeline",
  initialState,
  reducers: {
    pipelineStarted: (
      state,
      action: PayloadAction<{
        projectId: string;
        pipelineId: string;
        totalSteps: number;
        startedAt: string;
      }>
    ) => {
      const { projectId, pipelineId, totalSteps, startedAt } = action.payload;

      state.byProjectId[projectId] = {
        projectId,
        pipelineId,
        totalSteps, // Added totalSteps here
        status: "running",
        startedAt,
        stages: Array.from({ length: totalSteps }, (_, idx) => ({
          stageKey: `STEP_${idx + 1}`,
          label: `Stage ${idx + 1}`,
          status: "pending",
          step: idx + 1,
          totalSteps,
        })),
      };
    },

    pipelineStageUpdated: (
      state,
      action: PayloadAction<{
        projectId: string;
        pipelineId: string;
        stageKey: string;
        label: string;
        status: "success" | "failed";
        step: number;
        totalSteps: number;
      }>
    ) => {
      const { projectId, pipelineId, stageKey, label, status, step, totalSteps } =
        action.payload;

      const entry = state.byProjectId[projectId];
      if (!entry || entry.pipelineId !== pipelineId) return;

      entry.status = "running";

      const index = step - 1;
      if (!entry.stages[index]) {
        entry.stages[index] = {
          stageKey,
          label,
          status,
          step,
          totalSteps,
        };
      } else {
        entry.stages[index] = {
          ...entry.stages[index],
          stageKey,
          label,
          status,
          step,
          totalSteps,
        };
      }
    },

    pipelineCompleted: (
      state,
      action: PayloadAction<{
        projectId: string;
        pipelineId: string;
        status: AoiRunStatus;
        completedAt: string;
      }>
    ) => {
      const { projectId, pipelineId, status, completedAt } = action.payload;

      const entry = state.byProjectId[projectId];
      if (!entry || entry.pipelineId !== pipelineId) return;

      entry.status = status;
      entry.completedAt = completedAt;
    },

    resetPipelineForProject: (state, action: PayloadAction<{ projectId: string }>) => {
      delete state.byProjectId[action.payload.projectId];
    },
  },
});

export const {
  pipelineStarted,
  pipelineStageUpdated,
  pipelineCompleted,
  resetPipelineForProject,
} = aoiPipelineSlice.actions;

export default aoiPipelineSlice.reducer;

export const selectAoiStatusByProjectId = (state: RootState, projectId: string) =>
  state.aoiPipeline.byProjectId[projectId];
