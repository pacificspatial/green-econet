import { db } from "../db/connect.js";
import { Projects } from "../db/models/index.js";
import { exportsServices } from "./exportsServices.js";


// Util for consistent error formatting
function formatDbError(err, step) {
  return {
    step,
    message: err.message,
    code: err.code,
    severity: err.severity,
    detail: err.detail,
    hint: err.hint,
    position: err.position,
    stack: err.stack,
  };
}

const runPipeline = async ({ projectId, io }) => {
  console.log(`🚀 Starting pipeline for project: ${projectId}`);

  const steps = [
    { name: "AOI Service", fn: aoiService },
    { name: "Clip Service", fn: clipService },
    { name: "Merge Service", fn: mergeService },
    { name: "Buffer Service", fn: bufferService },
    { name: "Group Service", fn: groupService },
    { name: "Export Service", fn: exportsServices },
  ];
  let status = "success";
  const totalSteps = steps.length;
  const emit = (event, payload) => {
    if (!io) {
      console.warn("Socket.IO instance not found on app; cannot emit:", event);
      return;
    }
    io.emit(event, payload);
  };
    console.log(
    `[MOCK AOI] Starting pipeline for project ${projectId} with ${totalSteps} stages`
  );

  emit("aoi:pipeline_started", {
    projectId,
    totalSteps,
    startedAt: new Date().toISOString(),
  });

  let failed = 0, succeeded = 0, index = 0;

  for (const step of steps) {
    const start = Date.now();
    index++;
    try {
      console.log(`➡️ Running ${step.name}...`);
      await step.fn(projectId);
      succeeded++;
      status = "success";

      console.log(`✅ ${step.name} completed (${Date.now() - start}ms)`);
    } catch (err) {
      failed++;
      status = "failed";
      const formatted = formatDbError(err, step.name);
      console.error(`❌ Pipeline failed at step: ${step.name}`, formatted);
      // throw err; // stop pipeline immediately
    } finally {
      emit("aoi:pipeline_stage", {
        projectId,
        stageKey: step.name,
        label: step.name,
        status, // "success" | "failed"
        step: index, // 1..6
        totalSteps,
        timestamp: new Date().toISOString(),
      });

      // last stage → emit pipeline_completed
      if (index === totalSteps) {

        await Projects.update(
          { processed: true },
          { where: { id: projectId } }
        );

        const overallStatus =
          failed === 0
            ? "success"
            : succeeded === 0
            ? "failed"
            : "partial_failure";

        console.log(
          `[MOCK AOI] Pipeline completed for project ${projectId}. Status=${overallStatus}, success=${succeeded}, failed=${failed}`
        );

        emit("aoi:pipeline_completed", {
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
    }
  }

  console.log(`🎉 Pipeline completed successfully for project: ${projectId}`);
};

// -------------------------
// Individual Pipeline Steps
// -------------------------

const aoiService = async (projectId) => {
  try {
    await db.query("SELECT processing.set_aoi($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "AOI Service");
  }
};

const clipService = async (projectId) => {
  try {
    await db.query("SELECT processing.clip_green($1)", [projectId]);
    await db.query("SELECT processing.clip_buffer125_green($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "Clip Service");
  }
};

const mergeService = async (projectId) => {
  try {
    await db.query("SELECT processing.merge_green($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "Merge Service");
  }
};

const bufferService = async (projectId) => {
  try {
    await db.query("SELECT processing.buffer125_merged($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "Buffer Service");
  }
};

const groupService = async (projectId) => {
  try {
    await db.query("SELECT processing.assign_uids($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "Group Service");
  }
};

export default {
  runPipeline,
};
