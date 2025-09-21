// utils/safeJsonCall.js
export async function safeJsonCall(model, prompt) {
  try {
    const result = await model.generateContent(prompt);

    if (!result?.response) {
      throw new Error("No response object from Gemini API");
    }

    const text = result.response.text();
    return text;
  } catch (err) {
    console.error("❌ Gemini API call failed:", err);
    return "Error: Gemini request failed.";
  }
}
