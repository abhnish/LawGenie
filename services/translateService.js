import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { safeJsonCall } from "../utils/safeJsonCall.js";  // ✅ Reuse the helper

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper: Split text into safe chunks for Gemini
 */
function chunkText(text, size = 2000) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Translate text (chunked + safeJsonCall)
 */
export async function translateText(text, targetLanguage) {
  try {
    if (!text || text.trim().length === 0) return "";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chunks = chunkText(text);

    console.log(`📌 Splitting text into ${chunks.length} chunk(s)`);

    let translatedChunks = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      console.log(`⚡ Translating chunk ${idx + 1}/${chunks.length} (${chunk.length} chars)`);

      const prompt = `
        You are a legal translation assistant. 
        Translate the following text into ${targetLanguage}. 
        Preserve legal terminology and meaning.
        Respond ONLY with the translated text, no explanations.

        TEXT:
        """${chunk}"""
      `;

      const translated = await safeJsonCall(model, prompt);

      translatedChunks.push(translated);
    }

    const finalResult = translatedChunks.join("\n");
    console.log("✅ Translation completed successfully");
    return finalResult;
  } catch (err) {
    console.error("❌ Translation Error:", err);
    return "Error translating text.";
  }
}

/**
 * Translate analysis results (recursive, JSON-safe)
 */
export async function translateAnalysisResult(analysisResult, targetLanguage) {
  try {
    let resultObj;
    try {
      resultObj =
        typeof analysisResult === "string"
          ? JSON.parse(analysisResult)
          : analysisResult;
    } catch (e) {
      // Not JSON, just translate raw text
      return translateText(analysisResult, targetLanguage);
    }

    if (Array.isArray(resultObj)) {
      const translatedArray = [];
      for (const item of resultObj) {
        if (typeof item === "object") {
          const translatedItem = {};
          for (const [key, value] of Object.entries(item)) {
            translatedItem[key] =
              typeof value === "string"
                ? await translateText(value, targetLanguage)
                : await translateAnalysisResult(value, targetLanguage);
          }
          translatedArray.push(translatedItem);
        } else if (typeof item === "string") {
          translatedArray.push(await translateText(item, targetLanguage));
        } else {
          translatedArray.push(item);
        }
      }
      return translatedArray;
    }

    if (typeof resultObj === "object") {
      const translatedObj = {};
      for (const [key, value] of Object.entries(resultObj)) {
        translatedObj[key] =
          typeof value === "string"
            ? await translateText(value, targetLanguage)
            : await translateAnalysisResult(value, targetLanguage);
      }
      return translatedObj;
    }

    return translateText(analysisResult, targetLanguage);
  } catch (err) {
    console.error("❌ Error in translateAnalysisResult:", err);
    return "Error translating analysis result.";
  }
}

/**
 * Supported languages
 */
export function getSupportedLanguages() {
  return [
    { code: "ar", name: "Arabic" },
    { code: "zh", name: "Chinese" },
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "es", name: "Spanish" },
  ];
}
