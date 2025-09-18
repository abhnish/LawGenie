import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Helper: safely extract text from Gemini response
function extractText(result) {
  try {
    if (result?.response?.text) {
      return result.response.text();
    }
    if (result?.response?.candidates?.length > 0) {
      return (
        result.response.candidates[0]?.content?.parts
          ?.map((p) => p.text)
          .join(" ") || "⚠️ No text returned"
      );
    }
    return "⚠️ No response text found.";
  } catch (err) {
    console.error("Error extracting Gemini text:", err);
    return "⚠️ Failed to parse response.";
  }
}

// 🔹 Helper: Split text into chunks
function splitIntoChunks(text, size = 5000) {
  const regex = new RegExp(`.{1,${size}}`, "g");
  return text.match(regex) || [];
}

// 🔹 Helper: Retry wrapper
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`⚠️ Gemini API call failed (attempt ${i + 1}):`, err.message);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// 🔹 Summarize text (handles chunking + retry)
export async function summarizeText(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // If too long → break into chunks
    if (text.length > 5000) {
      console.log("⚠️ Text too long, chunking for summarization...");
      const chunks = splitIntoChunks(text, 5000);
      let summaries = [];

      for (let i = 0; i < chunks.length; i++) {
        console.log(`⏳ Summarizing chunk ${i + 1}/${chunks.length}`);
        const result = await withRetry(() =>
          model.generateContent(
            `Summarize the following legal text clearly and concisely:\n\n${chunks[i]}`
          )
        );
        summaries.push(extractText(result));
      }

      // Merge summaries into final summary
      const finalPrompt = `Combine the following partial summaries into one coherent, concise summary:\n\n${summaries.join(
        "\n\n"
      )}`;
      const finalResult = await withRetry(() =>
        model.generateContent(finalPrompt)
      );

      return extractText(finalResult);
    }

    // If short text → direct summarization
    console.log("🔹 Sending direct prompt to Gemini...");
    const result = await withRetry(() =>
      model.generateContent(
        `Summarize the following legal text clearly and concisely:\n\n${text}`
      )
    );

    return extractText(result);
  } catch (err) {
    console.error("❌ Gemini Error (summarize):", err.message, err);
    return "Error summarizing text.";
  }
}

// 🔹 Q&A over text
export async function askQuestion(text, question) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await withRetry(() =>
      model.generateContent(
        `Answer the question based on the following legal text:\n\n${text}\n\nQuestion: ${question}`
      )
    );
    return extractText(result);
  } catch (err) {
    console.error("Gemini Error (askQuestion):", err.message, err);
    return "Error answering question.";
  }
}
