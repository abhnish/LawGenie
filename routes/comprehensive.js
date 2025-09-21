// routes/comprehensive.js
import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { performComprehensiveAnalysis } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

router.post("/comprehensive", async (req, res) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return errorResponse(res, "file_id is required", 400);
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    // Detect MIME type
    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    // Extract text
    const text = await extractTextFromFile(filePath, mimetype);
    if (!text || text.trim().length === 0) {
      return errorResponse(res, "No text found in document", 400);
    }

    // Perform comprehensive legal analysis with Gemini
    const analysis = await performComprehensiveAnalysis(text);

    return successResponse(res, "Comprehensive analysis completed successfully ✅", {
      file_id,
      analysis,
    });
  } catch (error) {
    console.error("❌ Error performing comprehensive analysis:", error);
    return errorResponse(res, "Failed to perform comprehensive analysis", 500, error.message);
  }
});

export default router;
