import { ClippedBuffer125Green } from "../db/models/clippedBuffer125Green.js";
import { ClippedGreen } from "../db/models/clippedGreen.js";
import { MergedBuffer125Green } from "../db/models/mergedBuffer125Green.js";
import { MergedGreen } from "../db/models/mergedGreen.js";

const getClippedBuffer125GreenResult = async (projectId) => {  
  const rows = await ClippedBuffer125Green.findAll({
    where: { project_id: projectId },
  });
  
  return rows; 
};

const getClippedGreenResult = async (projectId) => {  
  const rows = await ClippedGreen.findAll({
    where: { project_id: projectId },
  });
  
  return rows; 
};

const getMergedBuffer125GreenResult = async (projectId) => {  
  const rows = await MergedBuffer125Green.findAll({
    where: { project_id: projectId },
  });

  return rows; 
};

const getMergedGreenResult = async (projectId) => {  
  const rows = await MergedGreen.findAll({
    where: { project_id: projectId },
  });
  
  return rows; 
};

export default {
  getClippedBuffer125GreenResult,
  getClippedGreenResult,
  getMergedBuffer125GreenResult,
  getMergedGreenResult
};