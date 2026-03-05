import OpenAI from "openai";
import { getSecret } from "../secrets/getSecret";
import { GoogleGenAI, GoogleGenAIOptions } from "@google/genai";

export const getOpenAIClient = async () => {
  const OPENAI_API_KEY = await getSecret("syllex_open_ai_key");
  if (!OPENAI_API_KEY) throw new Error("api key not found");
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

export const getGeminiClient = async () => {
  //VERTEX CONFIG
  const GEMINI_CLIENT_OPTIONS: GoogleGenAIOptions = {
    vertexai: true,
    apiKey: await getSecret("gemini_api_key_vertex")
  }
  /*
  //NO VERTEX
  const GEMINI_CLIENT_OPTIONS:GoogleGenAIOptions = {
    apiKey: await getSecret("gemini_api_key")
  }*/
  return new GoogleGenAI(GEMINI_CLIENT_OPTIONS)

}