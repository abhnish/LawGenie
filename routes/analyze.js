// routes/analyze.js
import express from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { summarizeText } from "../services/geminiService.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    let textContent = "";

    // 🔹 Extract text from PDF or DOCX
    if (mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const docxBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      textContent = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: "No readable text found in document" });
    }

    // 🔹 Summarize with Gemini (handles chunking internally)
    console.log("⏳ Sending extracted text to Gemini for summarization...");
    const summary = await summarizeText(textContent);

    res.json({
      message: "File analyzed successfully ✅",
      file_id,
      mimetype,
      summary,
    });
  } catch (err) {
    console.error("❌ Error analyzing file:", err);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

export default router;
