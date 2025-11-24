import { EnpBuffer125Green, EnpGreen } from "../db/models/index.js";
import CustomError from "../utils/customError.js";

const getGreenLayer = async () => {
  const greenLayer = await EnpGreen.findAll();
  if (!greenLayer) {
    throw new CustomError("green layer not found");
  }

  return greenLayer;
};

const getBuffer125GreenLayer = async () => {
  const buffer125GreenLayer = await EnpBuffer125Green.findAll();
  if (!buffer125GreenLayer) {
    throw new CustomError("Buffer 125 green layer not found");
  }

  return buffer125GreenLayer;
};

export default {
  getGreenLayer,
  getBuffer125GreenLayer,
};
