import express from "express";
import path from "path";
import { extractTextFromFile } from "../utils/fileProcessing.js";
import { compareDocuments } from "../services/geminiService.js";

const router = express.Router();

router.post("/compare", async (req, res) => {
  try {
    const { file_id_1, file_id_2 } = req.body;

    if (!file_id_1 || !file_id_2) {
      return res.status(400).json({ error: "file_id_1 and file_id_2 are required" });
    }

    const filePath1 = path.join(process.cwd(), "uploads", file_id_1);
    const filePath2 = path.join(process.cwd(), "uploads", file_id_2);

    let mimetype1 = file_id_1.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    let mimetype2 = file_id_2.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

    const text1 = await extractTextFromFile(filePath1, mimetype1);
    const text2 = await extractTextFromFile(filePath2, mimetype2);

    const comparison = await compareDocuments(text1, text2);

    res.json({ comparison });
  } catch (error) {
    console.error("❌ Error comparing documents:", error);
    res.status(500).json({ error: "Failed to compare documents" });
  }
});

export default router;
