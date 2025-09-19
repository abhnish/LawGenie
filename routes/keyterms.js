import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { extractKeyTerms } from "../services/geminiService.js";

const router = express.Router();

router.post("/keyterms", async (req, res) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: "file_id is required" });
    }

    const filePath = path.join(process.cwd(), "uploads", file_id);

    let mimetype = "application/pdf";
    if (file_id.endsWith(".docx")) {
      mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    const text = await extractTextFromFile(filePath, mimetype);

    const terms = await extractKeyTerms(text);

    res.json({ key_terms: terms });
  } catch (error) {
    console.error("❌ Error extracting key terms:", error);
    res.status(500).json({ error: "Failed to extract key terms" });
  }
});

export default router;
