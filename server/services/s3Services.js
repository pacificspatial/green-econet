import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const tileBucketName = process.env.TILES_BUCKET_NAME;
const downloadBucketName = process.env.DOWNLOAD_BUCKET_NAME;
const region = process.env.AWS_REGION || "ap-northeast-1";

const bucketMap = {
  tile: tileBucketName,
  download: downloadBucketName,
};

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToExportBucket(
  fileBuffer,
  fileName,
  mimeType,
  fileType = "pdf"
) {
  try {
    const cmd = new PutObjectCommand({
      Bucket: downloadBucketName,
      Key: `${fileType}/${fileName}`,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(cmd);

    return {
      key: `${fileType}/${fileName}`,
    };
  } catch (error) {
    console.error("Error in s3 service", error);
    throw error;
  }
}

const getPresignedUrlForFile = async (
  fileName,
  bucketName = "tile",
  expiresIn = 3600,
) => {
  try {    
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketMap[bucketName],
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
