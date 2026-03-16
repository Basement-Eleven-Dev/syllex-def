import { getGeminiClient } from "./getClient";
import { ZodType } from "zod";
import { MaterialInterface } from "../../models/material";
import { Part } from "@google/genai";
import { fetchBuffer } from "../fetchBuffer";

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

  console.log("ask gemini", prompt);
  console.log("length of text parts", prompt.length);
  console.log("number of text file parts", textFileParts.length);
  console.log(
    "parts",
    textFileParts.map((part) => part.inlineData),
  );

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
  return await askStrucuredGemini(
    prompt,
    materials,
    undefined,
    structure,
    temperature,
  );
};
