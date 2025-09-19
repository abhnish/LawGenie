import { summarizeText, askQuestion, extractKeyTerms } from "./services/geminiService.js";

const sampleText = `
This Agreement is made between Alpha Corp and Beta Ltd. 
Alpha agrees to deliver 1000 units by October 1, 2025. 
Beta will pay $200,000 within 30 days of delivery.
`;

async function runTests() {
  console.log("🔹 Testing Summarize...");
  console.log(await summarizeText(sampleText));

  console.log("\n🔹 Testing Ask Question...");
  console.log(await askQuestion(sampleText, "Who are the parties?"));

  console.log("\n🔹 Testing Key Terms...");
  console.log(await extractKeyTerms(sampleText));
}

runTests().catch(console.error);
