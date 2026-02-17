import { ChatCompletionContentPart } from "openai/resources/index";
import { getOpenAIClient } from "./getOpenAIClient";

export const askLLM = async (prompt: string, fileUrls: string[] = [], model: string = "gpt-4o"): Promise<string> => {
    const aiClient = await getOpenAIClient();

    // 1. Prepare the content array with your text prompt
    const content: ChatCompletionContentPart[] = [{ type: "text", text: prompt }];

    // 2. Add files as native file objects (Base64)
    for (const url of fileUrls) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        content.push({
            type: "file",
            file: {
                filename: url.split('/').pop() || "document.pdf",
                file_data: `data:application/pdf;base64,${base64Data}`
            }
        });
    }

    const response = await aiClient.chat.completions.create({
        model: model, // Must use gpt-4o or gpt-4o-mini
        messages: [{ role: "user", content: content }],
    });

    return response.choices[0].message?.content || "";
};