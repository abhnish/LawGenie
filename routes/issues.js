import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { identifyLegalIssues } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// -------------------------------
// Extract legal issues
// -------------------------------
router.post("/issues", async (req, res) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return errorResponse(res, "file_id is required", 400);
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    // Detect mimetype
    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    // Extract text
    const text = await extractTextFromFile(filePath, mimetype);

    if (!text || text.trim().length === 0) {
      return errorResponse(res, "No text extracted from file", 400);
    }

    // Run Gemini service
    const issues = await identifyLegalIssues(text);

    return successResponse(res, "Legal issues extracted successfully ✅", {
      file_id,
      issues,
    });
  } catch (error) {
    console.error("❌ Error extracting issues:", error);
    return errorResponse(res, "Failed to extract legal issues", 500, error.message);
  }
});

export default router;
