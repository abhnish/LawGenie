import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// -------------------------------
// Multer storage config
// -------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

// -------------------------------
// File filter (PDF & DOCX only)
// -------------------------------
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF/DOCX files allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// -------------------------------
// Upload route
// -------------------------------
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "No file uploaded or invalid type", 400);
    }

    return successResponse(res, "File uploaded successfully ✅", {
      file_id: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      status: "uploaded",
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return errorResponse(res, "File upload failed");
  }
});

export default router;
