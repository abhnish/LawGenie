import express from "express";
import fs from "fs";
import path from "path";
import * as geminiService from "../services/geminiService.js";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

// ------------------------------
// Helper: validate + extract text
// ------------------------------
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

// ------------------------------
// Routes
// ------------------------------

// Analyze (summary)
router.post("/analyze", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);
    const summary = await geminiService.summarizeText(text); // ✅ now safeJsonCall inside
    return successResponse(res, "Document analyzed successfully ✅", { file_id, mimetype, summary });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to analyze document");
  }
});

// Key terms
router.post("/keyterms", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);
    const terms = await geminiService.extractKeyTerms(text); // ✅ safeJsonCall
    return successResponse(res, "Key terms extracted successfully ✅", { file_id, terms });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to extract key terms");
  }
});

// Issues
router.post("/issues", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);
    const issues = await geminiService.identifyLegalIssues(text); // ✅ safeJsonCall
    return successResponse(res, "Legal issues identified successfully ✅", { file_id, issues });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to identify legal issues");
  }
});

// Clauses
router.post("/clauses", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);
    const analysis = await geminiService.analyzeContractClauses(text); // ✅ safeJsonCall
    return successResponse(res, "Contract clauses analyzed successfully ✅", { file_id, analysis });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to analyze contract clauses");
  }
});

// Comprehensive
router.post("/comprehensive", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;
    const text = await getFileText(file_id, mimetype);
    const analysis = await geminiService.performComprehensiveAnalysis(text); // ✅ safeJsonCall
    return successResponse(res, "Comprehensive analysis completed successfully ✅", { file_id, analysis });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to perform comprehensive analysis");
  }
});

// Compare two documents
router.post("/compare", async (req, res) => {
  try {
    const { file_id1, file_id2, mimetype1, mimetype2 } = req.body;
    if (!file_id1 || !file_id2) throw new Error("Missing file IDs for comparison");

    const text1 = await getFileText(file_id1, mimetype1);
    const text2 = await getFileText(file_id2, mimetype2);
    const comparison = await geminiService.compareDocuments(text1, text2); // ✅ safeJsonCall

    return successResponse(res, "Documents compared successfully ✅", { file_id1, file_id2, comparison });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to compare documents");
  }
});

// Question answering
router.post("/question", async (req, res) => {
  try {
    const { file_id, mimetype, question } = req.body;
    if (!question) throw new Error("Missing question");

    const text = await getFileText(file_id, mimetype);
    const answer = await geminiService.askQuestion(text, question); // ✅ safeJsonCall

    return successResponse(res, "Question answered successfully ✅", { file_id, question, answer });
  } catch (err) {
    return errorResponse(res, err.message || "Failed to answer question");
  }
});

export default router;
