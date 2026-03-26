import { getGeminiClient } from "./getClient";
import { ZodType } from "zod";
import { Part } from "@google/genai";
import { fetchBuffer } from "../fetchBuffer";
import { Material } from "../../models/schemas/material.schema";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const askStrucuredGemini = async <T>(
  prompt: string,
  materials: Material[] = [],
  model: string = "gemini-3-flash-preview",
  structure: ZodType<T>,
  temperature?: number,
): Promise<T> => {
  const validMaterials = materials.filter((m) => m.extractedTextFileUrl);

  const textFileBuffer = await Promise.all(
    validMaterials.map((m) => fetchBuffer(m.extractedTextFileUrl!)),
  );

  const textFileParts: Part[] = textFileBuffer.map((buffer) => ({
    inlineData: {
      mimeType: "text/plain",
      data: buffer.toString("base64"),
    },
  }));

  const client = await getGeminiClient();

  console.log("ask gemini", prompt);
  console.log("length of text parts", prompt.length);
  console.log("number of text file parts", textFileParts.length);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
              ...textFileParts,
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: structure.toJSONSchema(),
          temperature: temperature,
        },
      });
      return structure.parse(JSON.parse(response.text!));
    } catch (error: any) {
      if (error?.status === 429 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `Gemini rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unexpected: exceeded max retries");
};

export const askStructuredLLM = async <T>(
  prompt: string,
  materials: Material[] = [],
  structure: ZodType<T>,
  temperature?: number,
): Promise<T> => {
  return await askStrucuredGemini(
    prompt,
    materials,
    undefined,
    structure,
    temperature,
  );
};
