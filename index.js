import express from "express";
import cors from "cors";
import dotenv from "dotenv";   // ✅ import dotenv first

// Load environment variables
dotenv.config();

// Import routes
import uploadRouter from "./routes/upload.js";
import analyzeRouter from "./routes/analyze.js";
import docsRouter from "./routes/docs.js";
import translateRouter from "./routes/translate.js";
import storageRouter from "./routes/storage.js";

const app = express();
app.use(cors());
app.use(express.json());

// Use routes
app.use("/api", uploadRouter);
app.use("/api", analyzeRouter);
app.use("/api", docsRouter);
app.use("/api/translate", translateRouter);
app.use("/api/storage", storageRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LawGenie backend running at http://localhost:${PORT}`);
  console.log("Bucket:", process.env.BUCKET_NAME);
  console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");
});
