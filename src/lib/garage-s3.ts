import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.GARAGE_S3_ENDPOINT!,
      region: process.env.GARAGE_S3_REGION || "garage",
      credentials: {
        accessKeyId: process.env.GARAGE_S3_ACCESS_KEY!,
        secretAccessKey: process.env.GARAGE_S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}
