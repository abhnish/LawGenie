import express from "express";
import path from "path";
import fs from "fs";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { compareDocuments } from "../services/geminiService.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();

router.post("/compare", async (req, res) => {
  try {
    const { file_id_1, file_id_2 } = req.body;

    if (!file_id_1 || !file_id_2) {
      return errorResponse(res, "file_id_1 and file_id_2 are required", 400);
    }

    const filePath1 = path.join(process.cwd(), "uploads", file_id_1);
    const filePath2 = path.join(process.cwd(), "uploads", file_id_2);

    if (!fs.existsSync(filePath1) || !fs.existsSync(filePath2)) {
      return errorResponse(res, "One or both files not found", 404);
    }

    // Detect MIME types
    const mimetype1 = file_id_1.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    const mimetype2 = file_id_2.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    // Extract text
    const text1 = await extractTextFromFile(filePath1, mimetype1);
    const text2 = await extractTextFromFile(filePath2, mimetype2);

    if (!text1 || !text2) {
      return errorResponse(res, "Failed to extract text from one or both files", 400);
    }

    // Compare documents with Gemini
    const comparison = await compareDocuments(text1, text2);

    return successResponse(res, "Documents compared successfully ✅", {
      file_id_1,
      file_id_2,
      mimetype1,
      mimetype2,
      comparison,
    });
  } catch (error) {
    console.error("❌ Error comparing documents:", error);
    return errorResponse(res, "Failed to compare documents");
  }
});

export default router;
