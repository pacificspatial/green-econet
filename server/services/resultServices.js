import { db } from "../db/connect.js";
import { ClippedBuffer125Green } from "../db/models/clippedBuffer125Green.js";
import { ClippedGreen } from "../db/models/clippedGreen.js";

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

export default {
  getClippedBuffer125GreenResult,
  getClippedGreenResult
};