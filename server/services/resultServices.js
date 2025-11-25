import { db } from "../db/connect.ts";
import { ClippedBuffer125Green } from "../db/models/clippedBuffer125Green.js";

const getClippedBuffer125GreenResult = async (projectId) => {  
  const rows = await ClippedBuffer125Green.findAll({
    where: { project_id: projectId },
  });
  
  return rows; 
};

export default {
  getClippedBuffer125GreenResult,
};