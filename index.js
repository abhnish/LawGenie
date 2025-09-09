import express from "express";
import cors from "cors";
import dotenv from "dotenv";   // ✅ import dotenv first
import uploadRoutes from "./routes/upload.js";

// Load environment variables
dotenv.config();

import docsRoutes from "./routes/docs.js";  
import analyzeRoutes from "./routes/analyze.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", docsRoutes);
app.use("/api", analyzeRoutes);
app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LawGenie backend running at http://localhost:${PORT}`);
  console.log("Bucket:", process.env.BUCKET_NAME);
  console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Missing ❌");
});
