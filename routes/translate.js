import express from "express";
import fs from "fs";
import path from "path";
import * as translateService from "../services/translateService.js";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// -------------------------------
// Get supported languages
// -------------------------------
router.get("/languages", (req, res) => {
  try {
    const languages = translateService.getSupportedLanguages();
    return successResponse(res, "Languages retrieved successfully ✅", { languages });
  } catch (err) {
    console.error("❌ Error retrieving languages:", err);
    return errorResponse(res, "Failed to retrieve supported languages", 500, err.message);
  }
});

// -------------------------------
// Translate document
// -------------------------------
router.post("/document", async (req, res) => {
  try {
    const { file_id, mimetype, targetLanguage } = req.body;

    if (!file_id) return errorResponse(res, "Missing file_id", 400);
    if (!targetLanguage) return errorResponse(res, "Missing target language", 400);

    const filePath = path.join(process.cwd(), "uploads", file_id);
    console.log("📂 Looking for file:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found:", filePath);
      return errorResponse(res, "File not found", 404);
    }

    const text = await extractTextFromFile(filePath, mimetype || "application/pdf");
    if (!text || text.trim().length === 0) {
      return errorResponse(res, "No text extracted from file", 400);
    }

    console.log("📄 Extracted text length:", text.length);
    console.log("📄 Preview:", text.slice(0, 200));

    const translatedText = await translateService.translateText(text, targetLanguage);
    console.log("🌐 Translated text length:", translatedText?.length);
    console.log("🌐 Preview:", translatedText?.slice(0, 200));

    return successResponse(res, "Document translated successfully ✅", {
      file_id,
      targetLanguage,
      translatedText,
    });
  } catch (err) {
    console.error("❌ Error translating document:", err);
    return errorResponse(res, "Failed to translate document", 500, err.message);
  }
});

// -------------------------------
// Translate analysis result (JSON-safe)
// -------------------------------
router.post("/analysis", async (req, res) => {
  try {
    const { analysisResult, targetLanguage } = req.body;

    if (!analysisResult) return errorResponse(res, "Missing analysis result", 400);
    if (!targetLanguage) return errorResponse(res, "Missing target language", 400);

    console.log("📊 Analysis input type:", typeof analysisResult);
    console.log("📊 Preview:", JSON.stringify(analysisResult)?.slice(0, 200));

    const translatedResult = await translateService.translateAnalysisResult(
      analysisResult,
      targetLanguage
    );

    console.log("🌐 Translated analysis (preview):", JSON.stringify(translatedResult)?.slice(0, 200));

    return successResponse(res, "Analysis result translated successfully ✅", {
      targetLanguage,
      translatedResult,
    });
  } catch (err) {
    console.error("❌ Error translating analysis result:", err);
    return errorResponse(res, "Failed to translate analysis result", 500, err.message);
  }
});

export default router;
