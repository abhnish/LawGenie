import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Variable to track if we're using cloud storage or local storage
let usingLocalStorage = true;
let storage, bucket, bucketName;

// Create local storage directory if it doesn't exist
const localStorageDir = path.join(process.cwd(), 'permanent_storage');
if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
  console.log('📁 Created local storage directory:', localStorageDir);
}

// Try to initialize Google Cloud Storage if credentials are available
try {
  if (process.env.BUCKET_NAME) {
    const { Storage } = require('@google-cloud/storage');
    storage = new Storage();
    bucketName = process.env.BUCKET_NAME;
    bucket = storage.bucket(bucketName);
    
    // Test if we can use the bucket
    usingLocalStorage = false;
    console.log('✅ Using Google Cloud Storage for file storage');
  } else {
    console.log('⚠️ BUCKET_NAME environment variable not set, using local storage');
    usingLocalStorage = true;
  }
} catch (error) {
  console.log('⚠️ Google Cloud Storage initialization failed, using local storage instead:', error.message);
  usingLocalStorage = true;
}

/**
 * Upload a file to storage (cloud or local)
 * @param {string} filePath - Local path to the file
 * @param {string} originalFilename - Original name of the file
 * @returns {Promise<object>} - Uploaded file information
 */
export async function uploadFile(filePath, originalFilename) {
  if (usingLocalStorage) {
    return uploadFileLocal(filePath, originalFilename);
  } else {
    return uploadFileCloud(filePath, originalFilename);
  }
}

/**
 * Upload a file to Google Cloud Storage
 * @param {string} filePath - Local path to the file
 * @param {string} originalFilename - Original name of the file
 * @returns {Promise<object>} - Uploaded file information
 */
async function uploadFileCloud(filePath, originalFilename) {
  try {
    // Generate a unique filename with original name to avoid collisions
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const fileType = getFileType(fileExtension);

    // Upload the file to Google Cloud Storage
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

    // Make the file publicly accessible
    await bucket.file(uniqueFilename).makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;

    // Return file information
    return {
      id: uniqueFilename,
      name: originalFilename,
      url: publicUrl,
      contentType: fileType,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error uploading file to Google Cloud Storage:", error);
    throw error;
  }
}

/**
 * Upload a file to local storage
 * @param {string} filePath - Local path to the file
 * @param {string} originalFilename - Original name of the file
 * @returns {Promise<object>} - Uploaded file information
 */
async function uploadFileLocal(filePath, originalFilename) {
  try {
    // Generate a unique filename with original name to avoid collisions
    const fileExtension = path.extname(originalFilename);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const fileType = getFileType(fileExtension);
    
    // Define the permanent storage path
    const permanentStoragePath = path.join(localStorageDir, uniqueFilename);
    
    // Copy the file to permanent storage
    fs.copyFileSync(filePath, permanentStoragePath);
    
    // Create metadata file
    const metadata = {
      id: uniqueFilename,
      name: originalFilename,
      contentType: fileType,
      uploadedAt: new Date().toISOString(),
      size: fs.statSync(permanentStoragePath).size
    };
    
    // Save metadata
    const metadataPath = path.join(localStorageDir, `${uniqueFilename}.meta.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Return file information
    return {
      ...metadata,
      url: `/api/storage/local/${uniqueFilename}` // Local URL
    };
  } catch (error) {
    console.error("Error uploading file to local storage:", error);
    throw error;
  }
}

/**
 * Download a file from storage
 * @param {string} fileId - ID of the file in storage
 * @param {string} destinationPath - Path to save the downloaded file
 * @returns {Promise<string>} - Path to the downloaded file
 */
export async function downloadFile(fileId, destinationPath = null) {
  if (usingLocalStorage) {
    return downloadFileLocal(fileId, destinationPath);
  } else {
    return downloadFileCloud(fileId, destinationPath);
  }
}

/**
 * Download a file from Google Cloud Storage
 * @param {string} fileId - ID of the file in storage
 * @param {string} destinationPath - Path to save the downloaded file
 * @returns {Promise<string>} - Path to the downloaded file
 */
async function downloadFileCloud(fileId, destinationPath = null) {
  try {
    // Set the destination path if not provided
    const downloadPath =
      destinationPath ||
      path.join(process.cwd(), "downloads", fileId);

    // Create the downloads directory if it doesn't exist
    const downloadsDir = path.dirname(downloadPath);
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Download the file
    await bucket.file(fileId).download({
      destination: downloadPath,
    });

    return downloadPath;
  } catch (error) {
    console.error("Error downloading file from Google Cloud Storage:", error);
    throw error;
  }
}

/**
 * Download a file from local storage
 * @param {string} fileId - ID of the file in storage
 * @param {string} destinationPath - Path to save the downloaded file
 * @returns {Promise<string>} - Path to the downloaded file
 */
async function downloadFileLocal(fileId, destinationPath = null) {
  try {
    // Source path in permanent storage
    const sourcePath = path.join(localStorageDir, fileId);
    
    // Check if file exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`File ${fileId} not found in local storage`);
    }
    
    // Set the destination path if not provided
    const downloadPath = destinationPath || path.join(process.cwd(), 'downloads', fileId);
    
    // Create the downloads directory if it doesn't exist
    const downloadsDir = path.dirname(downloadPath);
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    // Copy the file to the download location
    fs.copyFileSync(sourcePath, downloadPath);
    
    return downloadPath;
  } catch (error) {
    console.error("Error downloading file from local storage:", error);
    throw error;
  }
}

/**
 * Delete a file from storage
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function deleteFile(fileId) {
  if (usingLocalStorage) {
    return deleteFileLocal(fileId);
  } else {
    return deleteFileCloud(fileId);
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteFileCloud(fileId) {
  try {
    await bucket.file(fileId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting file from Google Cloud Storage:", error);
    throw error;
  }
}

/**
 * Delete a file from local storage
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<boolean>} - True if deletion was successful
 */
async function deleteFileLocal(fileId) {
  try {
    // Delete the file
    const filePath = path.join(localStorageDir, fileId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete metadata if it exists
    const metadataPath = path.join(localStorageDir, `${fileId}.meta.json`);
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting file from local storage:", error);
    throw error;
  }
}

/**
 * List all files in storage
 * @returns {Promise<Array>} - Array of file information
 */
export async function listFiles() {
  if (usingLocalStorage) {
    return listFilesLocal();
  } else {
    return listFilesCloud();
  }
}

/**
 * List all files in Google Cloud Storage
 * @returns {Promise<Array>} - Array of file information
 */
async function listFilesCloud() {
  try {
    const [files] = await bucket.getFiles();

    const fileList = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

        return {
          id: file.name,
          name: metadata.metadata?.originalFilename || file.name,
          url: publicUrl,
          contentType: metadata.contentType,
          uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
        };
      })
    );

    return fileList;
  } catch (error) {
    console.error("Error listing files from Google Cloud Storage:", error);
    throw error;
  }
}

/**
 * List all files in local storage
 * @returns {Promise<Array>} - Array of file information
 */
async function listFilesLocal() {
  try {
    const files = fs.readdirSync(localStorageDir);
    
    // Filter out metadata files and get only actual files
    const fileList = files
      .filter(file => !file.endsWith('.meta.json'))
      .map(fileId => {
        try {
          // Try to read metadata
          const metadataPath = path.join(localStorageDir, `${fileId}.meta.json`);
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            return {
              ...metadata,
              url: `/api/storage/local/${fileId}`
            };
          }
          
          // If no metadata, generate basic info
          return {
            id: fileId,
            name: fileId,
            url: `/api/storage/local/${fileId}`,
            contentType: getFileType(path.extname(fileId)),
            uploadedAt: fs.statSync(path.join(localStorageDir, fileId)).mtime.toISOString()
          };
        } catch (err) {
          console.error(`Error reading metadata for ${fileId}:`, err);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries
      
    return fileList;
  } catch (error) {
    console.error("Error listing files from local storage:", error);
    throw error;
  }
}

/**
 * Get information about a file
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<object>} - File information
 */
export async function getFileInfo(fileId) {
  if (usingLocalStorage) {
    return getFileInfoLocal(fileId);
  } else {
    return getFileInfoCloud(fileId);
  }
}

/**
 * Get information about a file in Google Cloud Storage
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<object>} - File information
 */
async function getFileInfoCloud(fileId) {
  try {
    const [metadata] = await bucket.file(fileId).getMetadata();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileId}`;

    return {
      id: fileId,
      name: metadata.metadata?.originalFilename || fileId,
      url: publicUrl,
      contentType: metadata.contentType,
      uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
      size: metadata.size,
    };
  } catch (error) {
    console.error("Error getting file info from Google Cloud Storage:", error);
    throw error;
  }
}

/**
 * Get information about a file in local storage
 * @param {string} fileId - ID of the file in storage
 * @returns {Promise<object>} - File information
 */
async function getFileInfoLocal(fileId) {
  try {
    const filePath = path.join(localStorageDir, fileId);
    const metadataPath = path.join(localStorageDir, `${fileId}.meta.json`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${fileId} not found in local storage`);
    }
    
    // Try to read metadata
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return {
        ...metadata,
        url: `/api/storage/local/${fileId}`
      };
    }
    
    // If no metadata, generate basic info
    return {
      id: fileId,
      name: fileId,
      url: `/api/storage/local/${fileId}`,
      contentType: getFileType(path.extname(fileId)),
      uploadedAt: fs.statSync(filePath).mtime.toISOString(),
      size: fs.statSync(filePath).size
    };
  } catch (error) {
    console.error("Error getting file info from local storage:", error);
    throw error;
  }
}

/**
 * Move a file from temporary uploads to permanent storage
 * @param {string} fileId - ID of the file in temporary storage
 * @param {string} originalFilename - Original name of the file
 * @returns {Promise<object>} - Information about the stored file
 */
export async function storeUploadedFile(fileId, originalFilename) {
  try {
    const tempFilePath = path.join(process.cwd(), "uploads", fileId);

    // Check if the file exists in temporary storage
    if (!fs.existsSync(tempFilePath)) {
      throw new Error("File not found in temporary storage");
    }

    // Upload to storage (cloud or local)
    const fileInfo = await uploadFile(tempFilePath, originalFilename);

    // Optionally delete the temporary file after successful upload
    // fs.unlinkSync(tempFilePath);

    return fileInfo;
  } catch (error) {
    console.error("Error storing uploaded file:", error);
    throw error;
  }
}

/**
 * Get the MIME type for a file extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
function getFileType(extension) {
  const types = {
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
  };

  return types[extension.toLowerCase()] || "application/octet-stream";
}
