import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

export async function uploadToGCS(file) {
  const bucket = storage.bucket(bucketName);
  const gcsFileName = Date.now() + "_" + file.originalname;
  await bucket.upload(file.path, { destination: gcsFileName });
  return gcsFileName;
}
