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

export default {
  getClippedBuffer125GreenResult,
};