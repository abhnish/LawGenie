import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";

// ================== CONFIG ==================
let usingLocalStorage = true;
let storage, bucket, bucketName;

// Local permanent storage path
const localStorageDir = path.join(process.cwd(), "permanent_storage");
if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
  console.log("📁 Created local storage directory:", localStorageDir);
}

// Try Google Cloud Storage
try {
  if (process.env.BUCKET_NAME) {
    storage = new Storage();
    bucketName = process.env.BUCKET_NAME;
    bucket = storage.bucket(bucketName);
    usingLocalStorage = false;
    console.log("✅ Using Google Cloud Storage for file storage");
  } else {
    console.log("⚠️ BUCKET_NAME not set, using local storage");
  }
} catch (error) {
  console.log("⚠️ Failed to init Google Cloud Storage:", error.message);
  usingLocalStorage = true;
}

// ================== CORE UPLOAD ==================
export async function uploadFile(filePath, originalFilename) {
  return usingLocalStorage
    ? uploadFileLocal(filePath, originalFilename)
    : uploadFileCloud(filePath, originalFilename);
}

async function uploadFileCloud(filePath, originalFilename) {
  try {
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const fileType = getFileType(fileExtension);

    await bucket.upload(filePath, {
      destination: uniqueFilename,
      metadata: {
        contentType: fileType,
        metadata: {
          originalFilename,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Generate signed URL (1 hour validity)
    const [signedUrl] = await bucket.file(uniqueFilename).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60,
    });

    return {
      id: uniqueFilename,
      name: originalFilename,
      url: signedUrl,
      contentType: fileType,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error uploading to GCS:", error.code, error.message);
    throw error;
  }
}

async function uploadFileLocal(filePath, originalFilename) {
  try {
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const fileType = getFileType(fileExtension);
    const permanentPath = path.join(localStorageDir, uniqueFilename);

    fs.copyFileSync(filePath, permanentPath);

    const metadata = {
      id: uniqueFilename,
      name: originalFilename,
      contentType: fileType,
      uploadedAt: new Date().toISOString(),
      size: fs.statSync(permanentPath).size,
    };

    fs.writeFileSync(
      path.join(localStorageDir, `${uniqueFilename}.meta.json`),
      JSON.stringify(metadata, null, 2)
    );

    return {
      ...metadata,
      url: `/api/storage/local/${uniqueFilename}`,
    };
  } catch (error) {
    console.error("❌ Error uploading to local storage:", error.message);
    throw error;
  }
}

// ================== DOWNLOAD ==================
export async function downloadFile(fileId, destinationPath = null) {
  return usingLocalStorage
    ? downloadFileLocal(fileId, destinationPath)
    : downloadFileCloud(fileId, destinationPath);
}

async function downloadFileCloud(fileId, destinationPath = null) {
  try {
    const downloadPath =
      destinationPath || path.join(process.cwd(), "downloads", fileId);

    if (!fs.existsSync(path.dirname(downloadPath))) {
      fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
    }

    await bucket.file(fileId).download({ destination: downloadPath });
    return downloadPath;
  } catch (error) {
    console.error("❌ Error downloading from GCS:", error.message);
    throw error;
  }
}

async function downloadFileLocal(fileId, destinationPath = null) {
  const sourcePath = path.join(localStorageDir, fileId);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File ${fileId} not found in local storage`);
  }

  const downloadPath =
    destinationPath || path.join(process.cwd(), "downloads", fileId);

  if (!fs.existsSync(path.dirname(downloadPath))) {
    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
  }

  fs.copyFileSync(sourcePath, downloadPath);
  return downloadPath;
}

// ================== DELETE ==================
export async function deleteFile(fileId) {
  return usingLocalStorage
    ? deleteFileLocal(fileId)
    : deleteFileCloud(fileId);
}

async function deleteFileCloud(fileId) {
  await bucket.file(fileId).delete().catch((err) => {
    console.error("❌ Error deleting from GCS:", err.message);
    throw err;
  });
  return true;
}

async function deleteFileLocal(fileId) {
  const filePath = path.join(localStorageDir, fileId);
  const metadataPath = `${filePath}.meta.json`;
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);
  return true;
}

// ================== LIST ==================
export async function listFiles() {
  return usingLocalStorage ? listFilesLocal() : listFilesCloud();
}

async function listFilesCloud() {
  const [files] = await bucket.getFiles();
  return Promise.all(
    files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60,
      });

      return {
        id: file.name,
        name: metadata.metadata?.originalFilename || file.name,
        url: signedUrl,
        contentType: metadata.contentType,
        uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
      };
    })
  );
}

async function listFilesLocal() {
  const files = fs.readdirSync(localStorageDir);
  return files
    .filter((f) => !f.endsWith(".meta.json"))
    .map((fileId) => {
      const metadataPath = path.join(localStorageDir, `${fileId}.meta.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        return { ...metadata, url: `/api/storage/local/${fileId}` };
      }
      return {
        id: fileId,
        name: fileId,
        url: `/api/storage/local/${fileId}`,
        contentType: getFileType(path.extname(fileId)),
        uploadedAt: fs.statSync(path.join(localStorageDir, fileId)).mtime.toISOString(),
      };
    });
}

// ================== FILE INFO ==================
export async function getFileInfo(fileId) {
  return usingLocalStorage ? getFileInfoLocal(fileId) : getFileInfoCloud(fileId);
}

async function getFileInfoCloud(fileId) {
  const [metadata] = await bucket.file(fileId).getMetadata();
  const [signedUrl] = await bucket.file(fileId).getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60,
  });

  return {
    id: fileId,
    name: metadata.metadata?.originalFilename || fileId,
    url: signedUrl,
    contentType: metadata.contentType,
    uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
    size: metadata.size,
  };
}

async function getFileInfoLocal(fileId) {
  const filePath = path.join(localStorageDir, fileId);
  if (!fs.existsSync(filePath)) throw new Error(`File ${fileId} not found`);

  const metadataPath = `${filePath}.meta.json`;
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return { ...metadata, url: `/api/storage/local/${fileId}` };
  }

  return {
    id: fileId,
    name: fileId,
    url: `/api/storage/local/${fileId}`,
    contentType: getFileType(path.extname(fileId)),
    uploadedAt: fs.statSync(filePath).mtime.toISOString(),
    size: fs.statSync(filePath).size,
  };
}

// ================== STORE UPLOADED FILE ==================
export async function storeUploadedFile(fileId, originalFilename) {
  const tempFilePath = path.join(process.cwd(), "uploads", fileId);
  if (!fs.existsSync(tempFilePath)) throw new Error("Temp file not found");

  const fileInfo = await uploadFile(tempFilePath, originalFilename);

  // cleanup temp upload
  try {
    fs.unlinkSync(tempFilePath);
  } catch (err) {
    console.warn("⚠️ Failed to cleanup temp file:", err.message);
  }

  return fileInfo;
}

// ================== MIME TYPES ==================
function getFileType(extension) {
  const types = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return types[extension.toLowerCase()] || "application/octet-stream";
}
