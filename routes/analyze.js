import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    // ✅ Use absolute path
    const filePath = path.join(process.cwd(), "uploads", file_id);
    console.log("🔍 Checking file path:", filePath);


    // Debugging log
    console.log("Looking for file at:", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // ✅ For now just return file info
    res.json({
      message: "File found ✅",
      file_id,
      mimetype,
      path: filePath
    });

  } catch (err) {
    console.error("❌ Error analyzing file:", err);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

export default router;
