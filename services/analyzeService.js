// services/analyzeService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze a legal/contract document
 * @param {string} text - Extracted document text
 * @returns {Promise<object>} - Structured analysis (summary, risks, clauses)
 */
export async function analyzeDocument(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a legal assistant. Analyze the following document text and return a structured JSON with:
- summary (5-10 bullet points),
- important clauses (with clause name and short explanation),
- potential risks (if any),
- obligations (what parties must do),
- missing elements (if relevant).

Document:
"""
${text}
"""

Return valid JSON only in this format:
{
  "summary": [],
  "clauses": [],
  "risks": [],
  "obligations": [],
  "missing_elements": []
}
`;

    const result = await model.generateContent(prompt);

    const output = result.response.text();

    // Try parsing JSON
    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (err) {
      console.warn("⚠️ Could not parse JSON, returning raw text");
      return { raw: output };
    }

    console.log("✅ Analysis Success");
    return parsed;

  } catch (err) {
    console.error("❌ Analysis Error:", err);
    return { error: "Failed to analyze document" };
  }
}
