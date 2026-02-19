import { toFile } from "openai";
import { MaterialInterface } from "../../models/material";
import { getOpenAIClient } from "./getOpenAIClient";
import { getDefaultDatabase } from "../getDatabase";

export const getOpenAiFileId = async (material: MaterialInterface): Promise<string> => {
    if (material.openAiFileId) return material.openAiFileId;
    const aiClient = await getOpenAIClient();
    const httpResultFile = await fetch(material.url!);
    if (!httpResultFile.ok || !httpResultFile.body) {
        throw new Error(`Could not fetch file or body is empty. Status: ${httpResultFile.status}`);
    }
    const arrayBuffer = await httpResultFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = await toFile(buffer, material.name);
    const upload = await aiClient.files.create({
        file: file,
        purpose: 'assistants',
    });
    const uploadID = upload.id;
    const db = await getDefaultDatabase();
    await db.collection('materials').updateOne({ _id: material._id! }, { $set: { openAiFileId: uploadID } });
    return uploadID
}