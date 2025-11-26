import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
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
  const bucketName = process.env.S3_EXPORT_BUCKET_NAME;

  const cmd = new PutObjectCommand({
    Bucket: bucketName,
    Key: `${fileType}/${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3.send(cmd);

  return {
    fileName,
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileType}/${fileName}`,
    key: `${fileType}/${fileName}`,
  };
}
