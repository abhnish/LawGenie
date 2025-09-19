import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { summarizeText } from "../services/geminiService.js";

const router = express.Router();

router.post("/summarize", async (req, res) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "file_id is required" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    // Guess MIME type from extension (basic handling)
    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    // Extract text
    const text = await extractTextFromFile(filePath, mimetype);

    // Summarize with Gemini
    const summary = await summarizeText(text);

    res.json({ summary });
  } catch (error) {
    console.error("❌ Error summarizing file:", error);
    res.status(500).json({ error: "Failed to summarize document" });
  }
});

export default router;
