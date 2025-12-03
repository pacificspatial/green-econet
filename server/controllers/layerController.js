import layerService from "../services/layerService.js";
import { success } from "../utils/response.js";

const getGreenLayer = async (req, res, next) => {
  try {
    const greenLayers = await layerService.getGreenLayer();
    return success(res, "Green layer fetched successfully", greenLayers);
  } catch (err) {
    console.log("Error in fetching green layers:", err.message);
    next(err);
  }
};

const getBuffer125GreenLayer = async (req, res, next) => {
  try {
    const buffer125GreenLayer = await layerService.getBuffer125GreenLayer();
    return success(
      res,
      "Buffer Green Layer fetched successfully",
      buffer125GreenLayer
    );
  } catch (err) {
    console.log("Error in fetching buffer green layers:", err.message);
    next(err);
  }
};

export default {
  getGreenLayer,
  getBuffer125GreenLayer,
};
