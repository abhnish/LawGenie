import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Translate text to the specified language using Gemini AI
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Language to translate to
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLanguage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Translate the following text to ${targetLanguage}. Maintain legal terminology accuracy and preserve the original meaning:\n\n${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Translation Error:", err);
    return "Error translating text.";
  }
}

/**
 * Translate analysis results to the specified language
 * @param {object} analysisResult - The analysis result object
 * @param {string} targetLanguage - Language to translate to
 * @returns {Promise<object>} - Translated analysis result
 */
export async function translateAnalysisResult(analysisResult, targetLanguage) {
  try {
    // Check if the result is a JSON string
    let resultObj;
    try {
      resultObj =
        typeof analysisResult === "string"
          ? JSON.parse(analysisResult)
          : analysisResult;
    } catch (e) {
      // If it's not valid JSON, treat it as a string
      return translateText(analysisResult, targetLanguage);
    }

    // If it's an array, translate each item
    if (Array.isArray(resultObj)) {
      const translatedArray = [];
      for (const item of resultObj) {
        if (typeof item === "object") {
          const translatedItem = {};
          for (const [key, value] of Object.entries(item)) {
            if (typeof value === "string") {
              translatedItem[key] = await translateText(value, targetLanguage);
            } else {
              translatedItem[key] = value;
            }
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

    // If it's an object, translate each string property
    if (typeof resultObj === "object") {
      const translatedObj = {};
      for (const [key, value] of Object.entries(resultObj)) {
        if (typeof value === "string") {
          translatedObj[key] = await translateText(value, targetLanguage);
        } else if (typeof value === "object") {
          translatedObj[key] = await translateAnalysisResult(value, targetLanguage);
        } else {
          translatedObj[key] = value;
        }
      }
      return translatedObj;
    }

    // If it's a string, just translate it
    return translateText(analysisResult, targetLanguage);
  } catch (err) {
    console.error("Translation Error:", err);
    return "Error translating analysis result.";
  }
}

/**
 * Get a list of supported languages
 * @returns {Array} - List of supported languages
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
