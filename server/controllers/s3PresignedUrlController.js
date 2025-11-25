import s3PresignedUrlService from "../services/s3PresignedUrlService.js";
import { success } from "../utils/response.js";

const getPresignedUrlForFile = async (req, res, next) => {
  try {
    const { fileName } = req.query;
    if (!fileName) {
      throw new CustomError("fileName query parameter is required.", 400);
    }
    const url = await s3PresignedUrlService.getPresignedUrlForFile(
      String(fileName)
    );
    return success(res, "Presigned url fetched successfully", url);
  } catch (err) {
    console.log("Error generating presigned URL:", err);
    next(err);
  }
};

export default {
  getPresignedUrlForFile,
};
