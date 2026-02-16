import OpenAI from "openai";
import { getSecret } from "../secrets/getSecret";

export async function getOpenAIClient() {
  const OPENAI_API_KEY = await getSecret("syllex_open_ai_key");
  if (!OPENAI_API_KEY) throw new Error("api key not found");
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}
