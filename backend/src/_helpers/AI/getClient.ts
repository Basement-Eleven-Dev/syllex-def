import OpenAI from "openai";
import { getSecret } from "../secrets/getSecret";
import { GoogleGenAI } from "@google/genai";

export const getOpenAIClient = async () => {
  const OPENAI_API_KEY = await getSecret("syllex_open_ai_key");
  if (!OPENAI_API_KEY) throw new Error("api key not found");
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

export const getGeminiClient = async () => {
  const GEMINI_API_KEY = await getSecret("gemini_api_key");
  if (!GEMINI_API_KEY) throw new Error("api key not found");
  return new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  })

}