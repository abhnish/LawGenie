// testGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Pick model (use gemini-2.0-flash if 2.5 doesn’t work for you)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      "Summarize this: The quick brown fox jumps over the lazy dog."
    );

    console.log("✅ Gemini Response:", result.response.text());
  } catch (err) {
    console.error("❌ Gemini test error:", err);
  }
}

test();
