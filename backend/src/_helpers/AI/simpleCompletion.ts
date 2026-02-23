import { getGeminiClient, getOpenAIClient } from "./getClient";
import { ZodType } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { ResponseInput, ResponseInputContent, ResponseInputFile } from "openai/resources/responses/responses";
import { MaterialInterface } from "../../models/material";
import { getOpenAiFileId } from "./openAiFileUpload";
import { Part } from "@google/genai";

const DEFAULT_PROVIDER: 'gemini' | 'openai' = 'gemini'

export const askLLM = async (prompt: string, materials: MaterialInterface[] = [], model: string = "gpt-4o", temperature?: number): Promise<string> => {
    const aiClient = await getOpenAIClient();

    // 1. Prepare the content array with your text prompt
    const fileIds: string[] = await Promise.all(materials.map(el => getOpenAiFileId(el)));
    const fileInputs: ResponseInputFile[] = fileIds.map(el => ({
        type: "input_file",
        file_id: el
    }))
    const content: ResponseInputContent[] = fileInputs;
    content.push({ type: "input_text", text: prompt })
    const input: ResponseInput = [
        { role: "user", content: content }
    ];
    const response = await aiClient.responses.create({
        temperature: temperature,
        store: false,
        model: model, // Must use gpt-4o or gpt-4o-mini
        input: input
    });

    return response.output_text
};

const askStrucuredGpt = async <T>(prompt: string, materials: MaterialInterface[] = [], model: string = "gpt-4o", structure: ZodType<T>, temperature?: number): Promise<T> => {
    const aiClient = await getOpenAIClient();

    // 1. Prepare the content array with your text prompt
    const fileIds: string[] = await Promise.all(materials.map(el => getOpenAiFileId(el)));
    const fileInputs: ResponseInputFile[] = fileIds.map(el => ({
        type: "input_file",
        file_id: el
    }))
    const content: ResponseInputContent[] = fileInputs;
    content.push({ type: "input_text", text: prompt })
    const input: ResponseInput = [
        { role: "user", content: content }
    ];
    const response = await aiClient.responses.parse({
        temperature: temperature,
        store: false,
        model: model, // Must use gpt-4o or gpt-4o-mini
        input: input,
        text: {
            format: zodTextFormat(structure, "question_type")
        }
    });

    return response.output_parsed!
};

export const askStructuredLLM = async <T>(prompt: string, materials: MaterialInterface[] = [], structure: ZodType<T>, temperature?: number): Promise<T> => {
    if (DEFAULT_PROVIDER == 'gemini') return askStrucuredGemini(prompt, materials, undefined, structure, temperature);
    else return askStrucuredGpt(prompt, materials, undefined, structure, temperature);
}


const askStrucuredGemini = async <T>(prompt: string, materials: MaterialInterface[] = [], model: string = "gemini-3-flash-preview", structure: ZodType<T>, temperature?: number): Promise<T> => {
    const getMaterialPart = async (m: MaterialInterface): Promise<Part> => {
        const res = await fetch(m.url!);
        const pdfArrayBuffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type");
        const mimeType = contentType?.split(';')[0];
        return {
            inlineData: {
                mimeType: mimeType,
                data: Buffer.from(pdfArrayBuffer).toString("base64")
            }
        }
    }
    const client = await getGeminiClient();
    const materialParts = await Promise.all(materials.map(m => getMaterialPart(m)))
    const response = await client.models.generateContent({
        model: model,
        contents: [{
            role: 'user',
            parts: [
                {
                    text: prompt,
                },
                ...materialParts
            ]
        }],
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: structure.toJSONSchema(),
            temperature: temperature
        }
    });
    return structure.parse(JSON.parse(response.text!))
}