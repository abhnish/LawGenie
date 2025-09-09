import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Translate text into the target language using Gemini
 * @param {string} text - The text to translate
 * @param {string} targetLang - Target language code (e.g., "en", "hi", "fr")
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang = "en") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Translate the following legal text into ${targetLang}. 
    Preserve meaning, accuracy, and tone:\n\n${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Translation Error:", err);
    return "Error translating text.";
  }
}

/**
 * Translate all fields inside the analysis JSON result
 * @param {object} analysisResult - JSON with summary, clauses, risks, glossary
 * @param {string} targetLang - Target language code
 * @returns {Promise<object>} Translated JSON
 */
export async function translateAnalysisResult(analysisResult, targetLang = "en") {
  const translated = { ...analysisResult };

  // Translate summary
  if (analysisResult.summary) {
    translated.summary = await translateText(analysisResult.summary, targetLang);
  }

  // Translate clauses
  if (analysisResult.clauses && Array.isArray(analysisResult.clauses)) {
    translated.clauses = [];
    for (let clause of analysisResult.clauses) {
      translated.clauses.push(await translateText(clause, targetLang));
    }
  }

  // Translate risks
  if (analysisResult.risks && Array.isArray(analysisResult.risks)) {
    translated.risks = [];
    for (let risk of analysisResult.risks) {
      translated.risks.push(await translateText(risk, targetLang));
    }
  }

  // Translate glossary
  if (analysisResult.glossary && typeof analysisResult.glossary === "object") {
    translated.glossary = {};
    for (let term in analysisResult.glossary) {
      translated.glossary[term] = await translateText(
        analysisResult.glossary[term],
        targetLang
      );
    }
  }

  return translated;
}
