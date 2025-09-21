import express from "express";
import path from "path";
import fs from "fs";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { askQuestion } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { file_id, question } = req.body;

    if (!file_id || !question) {
      return errorResponse(res, "Missing file_id or question", 400);
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return errorResponse(res, "File not found", 404);
    }

    // Detect mimetype
    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    // Extract text
    const text = await extractTextFromFile(filePath, mimetype);

    if (!text || text.trim().length === 0) {
      return errorResponse(res, "No readable text found in document", 400);
    }

    // Ask Gemini
    const answer = await askQuestion(text, question);

    return successResponse(res, "Question answered successfully ✅", {
      file_id,
      question,
      mimetype,
      answer,
    });
  } catch (error) {
    console.error("❌ Error in ask route:", error);
    return errorResponse(res, "Failed to answer question");
  }
});

export default router;
