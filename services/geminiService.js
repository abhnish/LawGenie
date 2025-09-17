// services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeText(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Summarize the following legal text clearly and concisely:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error summarizing text.";
  }
}

export async function askQuestion(text, question) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Answer the question based on the following legal text:\n\n${text}\n\nQuestion: ${question}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error answering question.";
  }
}

export async function extractKeyTerms(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Extract and define the key legal terms from the following text. Format your response as a JSON array of objects with 'term' and 'definition' properties:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error extracting key terms.";
  }
}

export async function identifyLegalIssues(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Identify potential legal issues or concerns in the following legal document. Provide your analysis in a structured format with headings for different categories of issues:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error identifying legal issues.";
  }
}

export async function analyzeContractClauses(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the contract clauses in the following document. For each major clause:
1. Identify the clause type
2. Summarize its purpose
3. Note any unusual terms or potential risks
4. Suggest improvements if applicable

Format your response in a structured manner:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error analyzing contract clauses.";
  }
}

export async function performComprehensiveAnalysis(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Perform a comprehensive legal analysis of the following document. Your analysis should include:
1. Document type and purpose
2. Key parties involved
3. Main legal obligations and rights
4. Critical dates and deadlines
5. Potential legal risks and ambiguities
6. Recommendations for improvement
7. Overall assessment

Provide your analysis in a well-structured format with appropriate headings:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error performing comprehensive analysis.";
  }
}

export async function compareDocuments(text1, text2) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Compare the following two legal documents and highlight the key differences and similarities:
    
Document 1:
${text1}

Document 2:
${text2}

Provide your comparison in a structured format, focusing on substantive legal differences rather than minor wording changes.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Error comparing documents.";
  }
}
