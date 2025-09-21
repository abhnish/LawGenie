import express from "express";
import fs from "fs";
import path from "path";
import * as geminiService from "../services/geminiService.js";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// -----------------------------------
// Helper: Validate file and extract text
// -----------------------------------
const getFileText = async (file_id, mimetype) => {
  if (!file_id) throw new Error("Missing file_id");

  const filePath = path.join(process.cwd(), "uploads", file_id);
  if (!fs.existsSync(filePath)) throw new Error("File not found");

  const text = await extractTextFromFile(filePath, mimetype);
  if (!text || text.trim().length === 0) {
    throw new Error("No readable text found in document");
  }
  return text;
};

// -----------------------------------
// Routes
// -----------------------------------

// Analyze (summary)
router.post("/analyze", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);

    const summary = await geminiService.summarizeText(text);
    successResponse(res, "Document analyzed successfully ✅", { file_id, mimetype, summary });
  } catch (err) {
    errorResponse(res, err.message || "Failed to analyze document");
  }
});

// Key terms
router.post("/keyterms", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);

    const terms = await geminiService.extractKeyTerms(text);
    successResponse(res, "Key terms extracted successfully ✅", { file_id, terms });
  } catch (err) {
    errorResponse(res, err.message || "Failed to extract key terms");
  }
});

// Issues
router.post("/issues", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);

    const issues = await geminiService.identifyLegalIssues(text);
    successResponse(res, "Legal issues identified successfully ✅", { file_id, issues });
  } catch (err) {
    errorResponse(res, err.message || "Failed to identify legal issues");
  }
});

// Clauses
router.post("/clauses", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);

    const analysis = await geminiService.analyzeContractClauses(text);
    successResponse(res, "Contract clauses analyzed successfully ✅", { file_id, analysis });
  } catch (err) {
    errorResponse(res, err.message || "Failed to analyze contract clauses");
  }
});

// Comprehensive
router.post("/comprehensive", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);

    const analysis = await geminiService.performComprehensiveAnalysis(text);
    successResponse(res, "Comprehensive analysis completed successfully ✅", { file_id, analysis });
  } catch (err) {
    errorResponse(res, err.message || "Failed to perform comprehensive analysis");
  }
});

// Compare
router.post("/compare", async (req, res) => {
  try {
    const { file_id1, file_id2, mimetype1, mimetype2 } = req.body;

    if (!file_id1 || !file_id2) throw new Error("Missing file IDs for comparison");

    const text1 = await getFileText(file_id1, mimetype1);
    const text2 = await getFileText(file_id2, mimetype2);

    const comparison = await geminiService.compareDocuments(text1, text2);
    successResponse(res, "Documents compared successfully ✅", { file_id1, file_id2, comparison });
  } catch (err) {
    errorResponse(res, err.message || "Failed to compare documents");
  }
});

// Question
router.post("/question", async (req, res) => {
  try {
    const { file_id, mimetype, question } = req.body;
    if (!question) throw new Error("Missing question");

    const text = await getFileText(file_id, mimetype);
    const answer = await geminiService.askQuestion(text, question);

    successResponse(res, "Question answered successfully ✅", { file_id, question, answer });
  } catch (err) {
    errorResponse(res, err.message || "Failed to answer question");
  }
});

export default router;
