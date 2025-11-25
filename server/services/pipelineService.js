import { db } from "../db/connect.ts";

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

const runPipeline = async (projectId) => {
  console.log(`🚀 Starting pipeline for project: ${projectId}`);

  const steps = [
    { name: "AOI Service", fn: aoiService },
    { name: "Clip Service", fn: clipService },
    // { name: "Merge Service", fn: mergeService },
    // { name: "Buffer Service", fn: bufferService },
    // { name: "Group Service", fn: groupService },
    // { name: "Indices Service", fn: indicesService },
  ];

  for (const step of steps) {
    const start = Date.now();

    try {
      console.log(`➡️ Running ${step.name}...`);
      await step.fn(projectId);
      console.log(`✅ ${step.name} completed (${Date.now() - start}ms)`);
    } catch (err) {
      const formatted = formatDbError(err, step.name);
      console.error(`❌ Pipeline failed at step: ${step.name}`, formatted);
      // throw err; // stop pipeline immediately
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
    await db.query("SELECT processing.assign_groups($1)", [projectId]);
  } catch (err) {
    throw formatDbError(err, "Group Service");
  }
};

const indicesService = async (projectId) => {
  try {
    // Future logic here
    return true;
  } catch (err) {
    throw formatDbError(err, "Indices Service");
  }
};

export default {
  runPipeline,
};
