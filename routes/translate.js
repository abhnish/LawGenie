import express from "express";
import fs from "fs";
import path from "path";
import * as translateService from "../services/translateService.js";
import { extractTextFromFile } from "../utils/fileProcessing.js";

const router = express.Router();

// Get supported languages
router.get("/languages", (req, res) => {
  try {
    const languages = translateService.getSupportedLanguages();
    res.json({
      message: "Languages retrieved successfully ✅",
      languages
    });
  } catch (err) {
    console.error("❌ Error retrieving languages:", err);
    res.status(500).json({ error: "Failed to retrieve supported languages" });
  }
});

// Translate document
router.post("/document", async (req, res) => {
  try {
    const { file_id, mimetype, targetLanguage } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: "Missing target language" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const translatedText = await translateService.translateText(text, targetLanguage);

    res.json({
      message: "Document translated successfully ✅",
      file_id,
      targetLanguage,
      translatedText
    });
  } catch (err) {
    console.error("❌ Error translating document:", err);
    res.status(500).json({ error: "Failed to translate document" });
  }
});

// Translate analysis result
router.post("/analysis", async (req, res) => {
  try {
    const { analysisResult, targetLanguage } = req.body;

    if (!analysisResult) {
      return res.status(400).json({ error: "Missing analysis result" });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: "Missing target language" });
    }

    const translatedResult = await translateService.translateAnalysisResult(
      analysisResult,
      targetLanguage
    );

    res.json({
      message: "Analysis result translated successfully ✅",
      targetLanguage,
      translatedResult
    });
  } catch (err) {
    console.error("❌ Error translating analysis result:", err);
    res.status(500).json({ error: "Failed to translate analysis result" });
  }
});

export default router;
