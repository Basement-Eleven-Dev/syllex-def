import { getGeminiClient, getOpenAIClient } from "./getClient";
import { ZodType } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import {
  ResponseInput,
  ResponseInputContent,
  ResponseInputFile,
} from "openai/resources/responses/responses";
import { MaterialInterface } from "../../models/material";
import { getOpenAiFileId } from "./openAiFileUpload";
import { Part } from "@google/genai";
import { extractTextFromFile } from "../documents/extractTextFromFile";
import { fetchBuffer } from "../fetchBuffer";
import { text } from "stream/consumers";

const DEFAULT_PROVIDER: "gemini" | "openai" = "gemini";

const askStrucuredGpt = async <T>(
  prompt: string,
  materials: MaterialInterface[] = [],
  model: string = "gpt-4o",
  structure: ZodType<T>,
  temperature?: number,
): Promise<T> => {
  console.log("ask gpt", prompt);
  const aiClient = await getOpenAIClient();

  // 1. Prepare the content array with your text prompt
  const fileIds: string[] = await Promise.all(
    materials.map((el) => getOpenAiFileId(el)),
  );
  const fileInputs: ResponseInputFile[] = fileIds.map((el) => ({
    type: "input_file",
    file_id: el,
  }));
  const content: ResponseInputContent[] = fileInputs;
  content.push({ type: "input_text", text: prompt });
  const input: ResponseInput = [{ role: "user", content: content }];
  const response = await aiClient.responses.parse({
    temperature: temperature,
    store: false,
    model: model, // Must use gpt-4o or gpt-4o-mini
    input: input,
    text: {
      format: zodTextFormat(structure, "question_type"),
    },
  });

  return response.output_parsed!;
};
const askStrucuredGemini = async <T>(
  prompt: string,
  materials: MaterialInterface[] = [],
  model: string = "gemini-3-flash-preview",
  structure: ZodType<T>,
  temperature?: number,
): Promise<T> => {
  const getMaterialPart = async (m: MaterialInterface): Promise<Part> => {
    const res = await fetch(m.url!);
    const pdfArrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type");
    const mimeType = contentType?.split(";")[0];
    return {
      inlineData: {
        mimeType: mimeType,
        data: Buffer.from(pdfArrayBuffer).toString("base64"),
      },
    };
  };

  const textFileBuffer = await Promise.all(
    materials.map((m) => fetchBuffer(m.extractedTextFileUrl!)),
  );

  const textFileParts: Part[] = textFileBuffer.map((buffer, index) => ({
    inlineData: {
      mimeType: "text/plain",
      data: buffer.toString("base64"),
    },
  }));

  const client = await getGeminiClient();

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
};

export const askStructuredLLM = async <T>(
  prompt: string,
  materials: MaterialInterface[] = [],
  structure: ZodType<T>,
  temperature?: number,
): Promise<T> => {
  if (DEFAULT_PROVIDER == "gemini")
    return await askStrucuredGemini(
      prompt,
      materials,
      undefined,
      structure,
      temperature,
    );
  else
    return await askStrucuredGpt(
      prompt,
      materials,
      undefined,
      structure,
      temperature,
    );
};
