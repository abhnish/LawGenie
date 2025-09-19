import { GoogleAuth } from "google-auth-library";

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
async function withRetry(fn, retries = 3, delay = 1000) {
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
async function callGemini(prompt) {
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

// 🔹 High-level wrappers
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

export async function askQuestion(text, question) {
  return await withRetry(() =>
    callGemini(`Answer the question based on the following legal text:\n\n${text}\n\nQuestion: ${question}`)
  );
}

export async function extractKeyTerms(text) {
  return await withRetry(() =>
    callGemini(
      `Extract and define the key legal terms from the following text. Format as JSON array with 'term' and 'definition':\n\n${text}`
    )
  );
}

export async function identifyLegalIssues(text) {
  return await withRetry(() =>
    callGemini(`Identify potential legal issues in the document. Structure with headings:\n\n${text}`)
  );
}

export async function analyzeContractClauses(text) {
  return await withRetry(() =>
    callGemini(`Analyze the contract clauses in this document. For each clause:
1. Clause type
2. Purpose
3. Risks / unusual terms
4. Suggested improvements\n\n${text}`)
  );
}

export async function performComprehensiveAnalysis(text) {
  return await withRetry(() =>
    callGemini(`Perform a comprehensive legal analysis of this document. Include:
1. Document type and purpose
2. Parties involved
3. Obligations & rights
4. Deadlines
5. Risks & ambiguities
6. Recommendations
7. Overall assessment\n\n${text}`)
  );
}

export async function compareDocuments(text1, text2) {
  return await withRetry(() =>
    callGemini(`Compare these two legal documents and highlight key differences and similarities:
    
Document 1:
${text1}

Document 2:
${text2}`)
  );
}
