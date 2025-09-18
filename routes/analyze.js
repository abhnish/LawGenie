import express from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as geminiService from "../services/geminiService.js";
import { extractTextFromFile } from "../utils/fileProcessing.js";

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

    // Extract text from the file
    const text = await extractTextFromFile(filePath, mimetype);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No readable text found in document" });
    }

    // Generate summary using Gemini
    const summary = await geminiService.summarizeText(text);

    res.json({
      message: "Document analyzed successfully ✅",
      file_id,
      mimetype,
      summary
    });
  } catch (err) {
    console.error("❌ Error analyzing file:", err);
    res.status(500).json({ error: "Failed to analyze document" });
  }
});

// Add routes for each analysis type
router.post("/keyterms", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const terms = await geminiService.extractKeyTerms(text);

    res.json({
      message: "Key terms extracted successfully ✅",
      file_id,
      terms
    });
  } catch (err) {
    console.error("❌ Error extracting key terms:", err);
    res.status(500).json({ error: "Failed to extract key terms" });
  }
});

router.post("/issues", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const issues = await geminiService.identifyLegalIssues(text);

    res.json({
      message: "Legal issues identified successfully ✅",
      file_id,
      issues
    });
  } catch (err) {
    console.error("❌ Error identifying legal issues:", err);
    res.status(500).json({ error: "Failed to identify legal issues" });
  }
});

router.post("/clauses", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const analysis = await geminiService.analyzeContractClauses(text);

    res.json({
      message: "Contract clauses analyzed successfully ✅",
      file_id,
      analysis
    });
  } catch (err) {
    console.error("❌ Error analyzing contract clauses:", err);
    res.status(500).json({ error: "Failed to analyze contract clauses" });
  }
});

router.post("/comprehensive", async (req, res) => {
  try {
    const { file_id, mimetype } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const analysis = await geminiService.performComprehensiveAnalysis(text);

    res.json({
      message: "Comprehensive analysis completed successfully ✅",
      file_id,
      analysis
    });
  } catch (err) {
    console.error("❌ Error performing comprehensive analysis:", err);
    res.status(500).json({ error: "Failed to perform comprehensive analysis" });
  }
});

router.post("/compare", async (req, res) => {
  try {
    const { file_id1, file_id2, mimetype1, mimetype2 } = req.body;

    if (!file_id1 || !file_id2) {
      return res.status(400).json({ error: "Missing file IDs for comparison" });
    }

    const filePath1 = path.join(process.cwd(), "uploads", file_id1);
    const filePath2 = path.join(process.cwd(), "uploads", file_id2);

    if (!fs.existsSync(filePath1) || !fs.existsSync(filePath2)) {
      return res.status(404).json({ error: "One or both files not found" });
    }

    const text1 = await extractTextFromFile(filePath1, mimetype1);
    const text2 = await extractTextFromFile(filePath2, mimetype2);

    const comparison = await geminiService.compareDocuments(text1, text2);

    res.json({
      message: "Documents compared successfully ✅",
      file_id1,
      file_id2,
      comparison
    });
  } catch (err) {
    console.error("❌ Error comparing documents:", err);
    res.status(500).json({ error: "Failed to compare documents" });
  }
});

router.post("/question", async (req, res) => {
  try {
    const { file_id, mimetype, question } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "Missing file_id" });
    }

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const text = await extractTextFromFile(filePath, mimetype);
    const answer = await geminiService.askQuestion(text, question);

    res.json({
      message: "Question answered successfully ✅",
      file_id,
      question,
      answer
    });
  } catch (err) {
    console.error("❌ Error answering question:", err);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

export default router;