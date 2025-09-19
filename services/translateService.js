import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Translate text to the specified language using Gemini AI
 */
export async function translateText(text, targetLanguage) {
  try {
    if (!text || text.trim() === "") {
      return "No text extracted from document.";
    }

    const prompt = `Translate the following text into ${targetLanguage}. 
Maintain legal terminology accuracy and preserve the original meaning:\n\n${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error(`Translation Error [${targetLanguage}]:`, err.message || err);
    return "Error translating text.";
  }
}

/**
 * Translate analysis results (objects/arrays/strings)
 */
export async function translateAnalysisResult(analysisResult, targetLanguage) {
  try {
    let resultObj;
    try {
      resultObj = typeof analysisResult === "string"
        ? JSON.parse(analysisResult)
        : analysisResult;
    } catch {
      return translateText(analysisResult, targetLanguage);
    }

    if (Array.isArray(resultObj)) {
      return Promise.all(resultObj.map(item =>
        typeof item === "string"
          ? translateText(item, targetLanguage)
          : translateAnalysisResult(item, targetLanguage)
      ));
    }

    if (typeof resultObj === "object") {
      const translatedObj = {};
      for (const [key, value] of Object.entries(resultObj)) {
        if (typeof value === "string") {
          translatedObj[key] = await translateText(value, targetLanguage);
        } else {
          translatedObj[key] = await translateAnalysisResult(value, targetLanguage);
        }
      }
      return translatedObj;
    }

    return translateText(analysisResult, targetLanguage);
  } catch (err) {
    console.error(`Translation Error [${targetLanguage}]:`, err.message || err);
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
