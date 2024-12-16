import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";
import dotenv from "dotenv";

dotenv.config(); 

const API = axios.create({
  baseURL: process.env.API_BASE_URL || "https://emkc.org/api/v2/piston",
  timeout: 10000, 
});

export const executeCode = async (language, sourceCode) => {
  if (!LANGUAGE_VERSIONS[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (typeof sourceCode !== "string" || sourceCode.trim() === "") {
    throw new Error("Source code cannot be empty or non-string.");
  }

  const payload = {
    language,
    version: LANGUAGE_VERSIONS[language],
    files: [{ content: sourceCode }],
  };

  try {
    const response = await API.post("/execute", payload);
    return response.data;
  } catch (error) {
    console.error("Error executing code:", error.response?.data || error.message);
    throw new Error("Failed to execute code. Please try again.");
  }
};
