import { ChatCompletionContentPart } from "openai/resources/index";
import { getOpenAIClient } from "./getOpenAIClient";
import { ZodObject, ZodType } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { ResponseInput, ResponseInputContent, ResponseInputFile } from "openai/resources/responses/responses";
import { MaterialInterface } from "../../models/material";
import { getOpenAiFileId } from "./openAiFileUpload";

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

export const askStrucuredLLM = async <T>(prompt: string, materials: MaterialInterface[] = [], model: string = "gpt-4o", structure: ZodType<T>, temperature?: number): Promise<T> => {
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