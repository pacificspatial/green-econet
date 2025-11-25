import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = process.env.BUCKET_NAME;
const region = process.env.AWS_REGION || "ap-northeast-1";

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getPresignedUrlForFile = async (fileName, expiresIn = 3600) => {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn });
    return url;
  } catch (error) {
    console.error(
      `Error generating presigned URL for file "${fileName}":`,
      error
    );
    throw error;
  }
};

export default {
  getPresignedUrlForFile,
};
