import mongoose from "mongoose";
import express from "express";
import { Code } from "./models/Code"; 
import cors from "cors";
import dotenv from "dotenv"; 

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ message: "API is running!" });
});


app.post("/api/save-code", async (req, res) => {
  const { language, code, problemName } = req.body;


  if (!language || !code || !problemName) {
    return res
      .status(400)
      .json({ message: "Language, code, and problem name are required" });
  }

  try {
    const newCode = new Code({ language, code, problemName });
    await newCode.save();
    res.status(201).json({ message: "Code saved successfully" });
  } catch (err) {
    console.error("Error saving code:", err);
    res.status(500).json({ message: "Failed to save code" });
  }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
