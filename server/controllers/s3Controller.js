import s3Services from "../services/s3Services.js";
import { success } from "../utils/response.js";
import CustomError from "../utils/customError.js";

const getPresignedUrlForFile = async (req, res, next) => {
  try {
    const { fileName, bucketName } = req.query;
    if (!fileName) {
      throw new CustomError("fileName query parameter is required.", 400);
    }
    const url = await s3Services.getPresignedUrlForFile(String(fileName), bucketName);
    return success(res, "Presigned url fetched successfully", url);
  } catch (err) {
    console.log("Error generating presigned URL:", err);
    next(err);
  }
};

export default {
  getPresignedUrlForFile,
};
