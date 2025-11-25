// services/mockpipelineservice.js

import { v4 as uuidv4 } from "uuid";
import CustomError from "../utils/customError.js";
import { EnGreen, Projects, ProjectPolygons } from "../db/models/index.js";

// 6 realistic mock stages matching your real pipeline
const MOCK_AOI_STAGES = [
  {
    key: "CREATE_1000M_BUFFER",
    label: "Create 1,000m buffer from centroid", // save in project table (real)
  },
  {
    key: "CLIP_DATA",
    label: "Clip data (green & buffer125_green)", // green.json / buffer125_green.json
  },
  {
    key: "MERGE_DATA",
    label: "Merge drawn polygons and clipped_green",
  },
  {
    key: "SET_BUFFER",
    label: "Set 125m buffer and dissolve polygons",
  },
  {
    key: "ASSIGN_GROUP",
    label: "Assign group UID via spatial join",
  },
  {
    key: "CALCULATE_INDICES",
    label: "Calculate AOI indices (A, B, B-A)",
  },
];

// ─────────────────────────────────────────────
// Per-stage handlers – each runs a tiny DB query
// (read-only / super lightweight)
// ─────────────────────────────────────────────

/**
 * Stage 1: Create 1,000m buffer from centroid (mock)
 * Real: compute buffer and save to project table.
 * Mock: just read centroid / geom so we exercise the DB.
 */
async function runCreate1000mBufferFromCentroid(projectId) {
  console.log("[MOCK AOI] Stage CREATE_1000M_BUFFER – querying project centroid/geom");
  await Projects.findByPk(projectId, {
    attributes: ["id", "aoi_centroid", "geom"],
  });
}

/**
 * Stage 2: Clip data (green.json, buffer125_green.json)
 * Real: clip rasters/vectors, add UID.
 * Mock: count project polygons so we hit DB.
 */
async function runClipDataStage(projectId) {
  console.log("[MOCK AOI] Stage CLIP_DATA – counting project polygons");
  await ProjectPolygons.count({
    where: { project_id: projectId },
  });
}

/**
 * Stage 3: Merge data
 * Real: merge user-drawn polygons with clipped_green.
 * Mock: fetch a few polygons so we touch geometry.
 */
async function runMergeDataStage(projectId) {
  console.log("[MOCK AOI] Stage MERGE_DATA – selecting sample polygons");
  await ProjectPolygons.findAll({
    where: { project_id: projectId },
    attributes: ["id", "area_m2", "perimeter_m"],
    limit: 5,
  });
}

/**
 * Stage 4: Set buffer
 * Real: create 125m buffer, dissolve, add UID.
 * Mock: re-read project row.
 */
async function runSetBufferStage(projectId) {
  console.log("[MOCK AOI] Stage SET_BUFFER – reading project row");
  await Projects.findOne({
    where: { id: projectId },
    attributes: ["id", "name"],
  });
}

/**
 * Stage 5: Assign group
 * Real: spatial joins UIDs between clipped_green / merged_green / buffers.
 * Mock: run a simple aggregate on EnGreen so it feels like “green layer” usage.
 */
async function runAssignGroupStage() {
  console.log(
    "[MOCK AOI] Stage ASSIGN_GROUP – counting EnGreen features (mock green layer)"
  );
  await EnGreen.count(); // simple table hit
}

/**
 * Stage 6: Calculate indices
 * Real: run specific index SQLs, write back to project table.
 * Mock: re-read config so the stage feels like “index calc”.
 */
async function runCalculateIndicesStage(projectId) {
  console.log(
    "[MOCK AOI] Stage CALCULATE_INDICES – reading project config (mock indices)"
  );
  await Projects.findByPk(projectId, {
    attributes: ["id", "config"],
  });
}

// Map stage keys → handler functions
const STAGE_HANDLERS = {
  CREATE_1000M_BUFFER: runCreate1000mBufferFromCentroid,
  CLIP_DATA: runClipDataStage,
  MERGE_DATA: runMergeDataStage,
  SET_BUFFER: runSetBufferStage,
  ASSIGN_GROUP: runAssignGroupStage,
  CALCULATE_INDICES: runCalculateIndicesStage,
};

/**
 * Start a mock AOI pipeline for Set AOI.
 * - 6 stages mirroring the real geoprocessing pipeline
 * - Each stage runs a tiny DB query (SELECT / COUNT) so it’s realistic
 * - Failure simulation controlled via env:
 *     AOI_MOCK_SIMULATE_FAILURE=true|false
 * - Emits:
 *     aoi:pipeline_started
 *     aoi:pipeline_stage
 *     aoi:pipeline_completed
 */
export const startMockAoiPipeline = async ({ projectId, io }) => {
  const project = await Projects.findByPk(projectId);
  if (!project) {
    throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
  }

  const pipelineId = uuidv4();
  const totalSteps = MOCK_AOI_STAGES.length;

  // env flag to control failure simulation
  const simulateFailure =
    (process.env.AOI_MOCK_SIMULATE_FAILURE || "false") === "true";

  const emit = (event, payload) => {
    if (!io) {
      console.warn("Socket.IO instance not found on app; cannot emit:", event);
      return;
    }
    io.emit(event, payload);
  };

  console.log(
    `[MOCK AOI] Starting pipeline ${pipelineId} for project ${projectId} with ${totalSteps} stages`
  );

  emit("aoi:pipeline_started", {
    pipelineId,
    projectId,
    totalSteps,
    startedAt: new Date().toISOString(),
  });

  let succeeded = 0;
  let failed = 0;

  MOCK_AOI_STAGES.forEach((stage, index) => {
    const delayMs = (index + 1) * 2000; // 2s between stages – tweak if needed

    setTimeout(async () => {
      let status = "success";

      try {
        const handler = STAGE_HANDLERS[stage.key];
        if (handler) {
          console.log(
            `[MOCK AOI] Executing stage ${index + 1}/${totalSteps} – ${stage.key}`
          );
          await handler(projectId);
        } else {
          console.warn(
            `[MOCK AOI] No handler registered for stage ${stage.key}`
          );
        }

        // optional mock failure on the CLIP_DATA stage
        if (simulateFailure && stage.key === "CLIP_DATA") {
          console.log(
            "[MOCK AOI] simulateFailure=true – forcing failure on CLIP_DATA"
          );
          status = "failed";
        }
      } catch (err) {
        console.error(`[MOCK AOI] Error in stage ${stage.key}:`, err);
        status = "failed";
      }

      if (status === "failed") {
        failed += 1;
      } else {
        succeeded += 1;
      }

      emit("aoi:pipeline_stage", {
        pipelineId,
        projectId,
        stageKey: stage.key,
        label: stage.label,
        status, // "success" | "failed"
        step: index + 1, // 1..6
        totalSteps,
        timestamp: new Date().toISOString(),
      });

      // last stage → emit pipeline_completed
      if (index === totalSteps - 1) {
        const overallStatus =
          failed === 0
            ? "success"
            : succeeded === 0
            ? "failed"
            : "partial_failure";

        console.log(
          `[MOCK AOI] Pipeline ${pipelineId} completed for project ${projectId}. Status=${overallStatus}, success=${succeeded}, failed=${failed}`
        );

        emit("aoi:pipeline_completed", {
          pipelineId,
          projectId,
          status: overallStatus,
          summary: {
            totalSteps,
            succeeded,
            failed,
          },
          completedAt: new Date().toISOString(),
        });
      }
    }, delayMs);
  });

  // return immediately; pipeline continues in background via setTimeouts
  return { pipelineId };
};
