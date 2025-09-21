
import 'dotenv/config';
console.log("Loaded key:", process.env.GEMINI_API_KEY?.slice(0,10) + "..."); 

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const test = async () => {
  const result = await model.generateContent("Translate 'Hello, world' into Hindi");
  console.log(result.response.text());
};

test();
