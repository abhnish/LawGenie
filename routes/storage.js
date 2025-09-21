import express from "express";
import * as storageService from "../services/storageService.js";
import path from "path";
import fs from "fs";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// -------------------------------
// Store a file (move from uploads → permanent storage)
// -------------------------------
router.post("/store", async (req, res) => {
  try {
    const { file_id, originalFilename } = req.body;

    if (!file_id) return errorResponse(res, "Missing file_id", 400);
    if (!originalFilename) return errorResponse(res, "Missing originalFilename", 400);

    const filePath = path.join(process.cwd(), "uploads", file_id);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, "File not found in temporary storage", 404);
    }

    const fileInfo = await storageService.storeUploadedFile(file_id, originalFilename);
    return successResponse(res, "File stored successfully ✅", { file: fileInfo });
  } catch (err) {
    console.error("❌ Error storing file:", err);
    return errorResponse(res, "Failed to store file", 500, err.message);
  }
});

// -------------------------------
// List all stored files
// -------------------------------
router.get("/files", async (req, res) => {
  try {
    const files = await storageService.listFiles();
    return successResponse(res, "Files retrieved successfully ✅", { files });
  } catch (err) {
    console.error("❌ Error listing files:", err);
    return errorResponse(res, "Failed to list files", 500, err.message);
  }
});

// -------------------------------
// Get file info
// -------------------------------
router.get("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await storageService.getFileInfo(fileId);

    if (!fileInfo) return errorResponse(res, "File not found", 404);

    return successResponse(res, "File info retrieved successfully ✅", { file: fileInfo });
  } catch (err) {
    console.error("❌ Error getting file info:", err);
    return errorResponse(res, "Failed to get file info", 500, err.message);
  }
});

// -------------------------------
// HEAD route (check file existence / metadata only)
// -------------------------------
router.head("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await storageService.getFileInfo(fileId);

    if (!fileInfo) return res.sendStatus(404);

    res.setHeader("Content-Type", fileInfo.contentType || "application/octet-stream");
    res.setHeader("Content-Length", fileInfo.size || 0);
    res.setHeader("X-Uploaded-At", fileInfo.uploadedAt || "");
    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error checking file:", err);
    return res.sendStatus(500);
  }
});

// -------------------------------
// Download / Access a file
// -------------------------------
router.get("/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await storageService.getFileInfo(fileId);

    if (!fileInfo) return errorResponse(res, "File not found", 404);

    // If storage service already provides a signed URL → redirect
    if (fileInfo.url && fileInfo.url.startsWith("http")) {
      return res.redirect(fileInfo.url);
    }

    // Otherwise, serve local file
    const filePath = path.join(process.cwd(), "permanent_storage", fileId);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, "Local file not found", 404);
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.name}"`);
    res.setHeader("Content-Type", fileInfo.contentType);
    return res.sendFile(filePath);
  } catch (err) {
    console.error("❌ Error downloading file:", err);
    return errorResponse(res, "Failed to download file", 500, err.message);
  }
});

// -------------------------------
// Delete a file
// -------------------------------
router.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    await storageService.deleteFile(fileId);
    return successResponse(res, "File deleted successfully ✅");
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    return errorResponse(res, "Failed to delete file", 500, err.message);
  }
});

export default router;
