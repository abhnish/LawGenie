import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    // ✅ save file as hash-originalname.ext
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

// File filter
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

// Upload route
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid type" });
  }

  res.json({
    message: "File uploaded successfully ✅",
    file_id: req.file.filename, // <-- now includes original name
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
    status: "uploaded",
  });
});

export default router;
