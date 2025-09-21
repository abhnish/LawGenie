import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testTranslate() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = "Translate 'Hello World' to Hindi";
    const result = await model.generateContent(prompt);
    console.log("Output:", result.response.text());
  } catch (err) {
    console.error("Test Error:", err);
  }
}

testTranslate();
