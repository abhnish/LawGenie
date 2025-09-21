import express from "express";
import path from "path";
import fs from "fs";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { summarizeText } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

router.post("/summarize", async (req, res) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return errorResponse(res, "Missing file_id", 400);
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return errorResponse(res, "File not found", 404);
    }

    // Detect MIME type (basic check by extension)
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

    // Summarize with Gemini
    const summary = await summarizeText(text);

    return successResponse(res, "Document summarized successfully ✅", {
      file_id,
      mimetype,
      summary,
    });
  } catch (error) {
    console.error("❌ Error summarizing file:", error);
    return errorResponse(res, "Failed to summarize document");
  }
});

export default router;
