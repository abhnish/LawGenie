import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    message: "File uploaded successfully ✅",
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

export default router;   // ✅ ES Module export
