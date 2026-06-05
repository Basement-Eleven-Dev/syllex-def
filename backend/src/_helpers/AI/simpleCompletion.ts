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
  topP?: number,
  topK?: number,
): Promise<T> => {
  const validMaterials = materials.filter((m) => m.extractedTextFileUrl);

  const textFileBuffer = await Promise.all(
    validMaterials.map((m) => fetchBuffer(m.extractedTextFileUrl!)),
  );

  const MAX_CHARS = 1500000; // Very safe limit (around 400k tokens) to stay well below 1M tokens limit
  let currentTotalChars = 0;

  const textFileParts: Part[] = textFileBuffer
    .map((buffer, index) => {
      const m = validMaterials[index];
      let docText = buffer.toString("utf-8");

      // Wrap content with clear XML boundaries and include ID & Title metadata
      const startMarker = `\n--- START OF DOCUMENT ---\nDOCUMENT ID: ${m._id?.toString() || ""}\nDOCUMENT TITLE: ${m.name || ""}\n\n`;
      const endMarker = `\n--- END OF DOCUMENT ---\n`;
      let text = startMarker + docText + endMarker;

      if (currentTotalChars + text.length > MAX_CHARS) {
        const allowedChars = MAX_CHARS - currentTotalChars;
        if (allowedChars > startMarker.length + endMarker.length) {
          const contentLimit =
            allowedChars - startMarker.length - endMarker.length;
          docText = docText.substring(0, contentLimit);
          text = startMarker + docText + endMarker;
          currentTotalChars += text.length;
        } else {
          text = "";
        }
      } else {
        currentTotalChars += text.length;
      }

      if (!text) return null;

      return {
        inlineData: {
          mimeType: "text/plain",
          data: Buffer.from(text, "utf-8").toString("base64"),
        },
      } as Part;
    })
    .filter((part): part is Part => part !== null);

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
          topP: topP,
          topK: topK,
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
  topP?: number,
  topK?: number,
): Promise<T> => {
  return await askStrucuredGemini(
    prompt,
    materials,
    undefined,
    structure,
    temperature,
    topP,
    topK,
  );
};
