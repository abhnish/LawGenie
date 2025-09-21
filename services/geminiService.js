// services/geminiService.js
import { GoogleAuth } from "google-auth-library";
import { safeJsonCall } from "../utils/safeJsonCall.js";  // ✅ moved out

const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 🔹 Auth setup (service account JSON from GOOGLE_APPLICATION_CREDENTIALS)
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/generative-language"],
});

// 🔹 Get access token
async function getAccessToken() {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

// 🔹 Retry wrapper
export async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`⚠️ Gemini API call failed (attempt ${i + 1}): ${err.message}`);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// 🔹 Split large text into chunks
function splitIntoChunks(text, size = 8000) {
  const regex = new RegExp(`.{1,${size}}`, "gs");
  return text.match(regex) || [];
}

// 🔹 Core Gemini request
export async function callGemini(prompt) {
  const token = await getAccessToken();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") ||
    "⚠️ No text returned"
  );
}

//
// ===================== High-level Wrappers =====================
//

// 🔹 Summarization (plain text)
export async function summarizeText(text) {
  if (text.length > 8000) {
    console.log("⚠️ Text too long, chunking...");
    const chunks = splitIntoChunks(text, 8000);
    let summaries = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`⏳ Summarizing chunk ${i + 1}/${chunks.length}`);
      const summary = await withRetry(() =>
        callGemini(`Summarize the following legal text clearly and concisely:\n\n${chunks[i]}`)
      );
      summaries.push(summary);
    }

    const finalPrompt = `Combine the following partial summaries into one clear, concise summary:\n\n${summaries.join(
      "\n\n"
    )}`;
    return await withRetry(() => callGemini(finalPrompt));
  }

  return await withRetry(() =>
    callGemini(`Summarize the following legal text clearly and concisely:\n\n${text}`)
  );
}

// 🔹 Q&A (plain text)
export async function askQuestion(text, question) {
  return await withRetry(() =>
    callGemini(
      `Answer the following question based strictly on the legal text below. 
Return ONLY plain text (no JSON needed).

Text:
${text}

Question: ${question}`
    )
  );
}

// 🔹 Extract key terms (JSON)
export async function extractKeyTerms(text) {
  return await safeJsonCall(
    `Extract and define the key legal terms from the following text.
Return ONLY valid JSON in this format:

[
  { "term": "Party A", "definition": "The buyer company" },
  { "term": "Indemnity", "definition": "Obligation to compensate for damages" }
]

Text:
${text}`
  );
}

// 🔹 Identify legal issues (JSON)
export async function identifyLegalIssues(text) {
  return await safeJsonCall(
    `Identify potential legal issues in the document.
Return ONLY valid JSON in this format:

[
  { "issue": "Ambiguous termination clause", "explanation": "Termination conditions are vague" },
  { "issue": "Missing dispute resolution clause", "explanation": "No mechanism for arbitration or litigation" }
]

Text:
${text}`
  );
}

// 🔹 Analyze contract clauses (JSON)
export async function analyzeContractClauses(text) {
  return await safeJsonCall(
    `Analyze the contract clauses in this document.
For each clause, return ONLY valid JSON in this format:

[
  {
    "clause": "Termination",
    "purpose": "Specifies conditions under which the contract may end",
    "risk": "Ambiguous language may favor one party",
    "suggestion": "Clarify notice period and mutual rights"
  }
]

Text:
${text}`
  );
}

// 🔹 Comprehensive analysis (JSON)
export async function performComprehensiveAnalysis(text) {
  return await safeJsonCall(
    `Perform a comprehensive legal analysis of this document.
Return ONLY valid JSON in this format:

{
  "documentType": "Employment Agreement",
  "parties": ["Employer", "Employee"],
  "obligations": "Employer provides salary, Employee provides services",
  "deadlines": "30 days' notice for termination",
  "risks": ["Ambiguous non-compete clause"],
  "recommendations": ["Clarify scope of non-compete"],
  "overallAssessment": "Generally balanced but with some ambiguities"
}

Text:
${text}`
  );
}

// 🔹 Compare documents (plain text)
export async function compareDocuments(text1, text2) {
  return await withRetry(() =>
    callGemini(`Compare these two legal documents and highlight key differences and similarities.
Return plain text (bullet points are fine).

Document 1:
${text1}

Document 2:
${text2}`)
  );
}
