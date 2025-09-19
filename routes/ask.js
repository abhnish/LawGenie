import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { askQuestion } from "../services/geminiService.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { file_id, question } = req.body;

    if (!file_id || !question) {
      return res.status(400).json({ error: "file_id and question are required" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    // Detect mimetype
    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    const text = await extractTextFromFile(filePath, mimetype);

    const answer = await askQuestion(text, question);

    res.json({ answer });
  } catch (error) {
    console.error("❌ Error in ask route:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;
