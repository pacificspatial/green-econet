import type { S3PresignedUrlParam } from "@/types/ApiHandlers";
import axiosInstance from "./axiosInstance";

// fetch green layer data
export const getS3PreSignedUrl = async ({fileName}:S3PresignedUrlParam) => {
  const res = await axiosInstance.get(`/s3-presigned-url?fileName=${fileName}`,);
  return res.data;
};

