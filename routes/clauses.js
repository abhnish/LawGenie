// routes/clauses.js
import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { analyzeContractClauses } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

router.post("/clauses", async (req, res) => {
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

    // Analyze contract clauses using Gemini
    const clauses = await analyzeContractClauses(text);

    return successResponse(res, "Contract clauses analyzed successfully ✅", {
      file_id,
      clauses,
    });
  } catch (error) {
    console.error("❌ Error analyzing clauses:", error);
    return errorResponse(res, "Failed to analyze contract clauses", 500, error.message);
  }
});

export default router;
