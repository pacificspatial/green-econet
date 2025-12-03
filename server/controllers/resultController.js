import { success } from "../utils/response.js";
import resultServices from "../services/resultServices.js";

const getClippedBuffer125GreenResult = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const result = await resultServices.getClippedBuffer125GreenResult(
      projectId
    );
    success(res, "Clipped Buffer125 Green Result fetched successfully", result);
  } catch (err) {
    console.log("Error in getClippedBuffer125GreenResult:", err);
    next(err);
  }
};

const getClippedGreenResult = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const result = await resultServices.getClippedGreenResult(
      projectId
    );
    success(res, "Clipped Green Result fetched successfully", result);
  } catch (err) {
    console.log("Error in getClippedGreenResult:", err);
    next(err);
  }
};

const getMergedBuffer125GreenResult = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const result = await resultServices.getMergedBuffer125GreenResult(
      projectId
    );
    success(res, "Merged Buffer125 Green Result fetched successfully", result);
  } catch (err) {
    console.log("Error in getMergedBuffer125GreenResult:", err);
    next(err);
  }
};

const getMergedGreenResult = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const result = await resultServices.getMergedGreenResult(
      projectId
    );
    success(res, "Merged Green Result fetched successfully", result);
  } catch (err) {
    console.log("Error in getMergedGreenResult:", err);
    next(err);
  }
};

export default {
  getClippedBuffer125GreenResult,
  getClippedGreenResult,
  getMergedBuffer125GreenResult,
  getMergedGreenResult
};