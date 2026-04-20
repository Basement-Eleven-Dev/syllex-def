import { SQSEvent, SQSHandler } from "aws-lambda";
import { connectDatabase } from "../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import {
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { extractTextFromFile } from "../_helpers/documents/extractTextFromFile";
import {
  VectorizeDocumentParams,
  vectorizeDocumentWithGemini,
} from "../_helpers/AI/embeddings/vectorizeDocument";
import { vectorizeKnowledgeManualWithGemini } from "../_helpers/AI/embeddings/vectorizeKnowledgeDocument";
import { fetchBuffer } from "../_helpers/fetchBuffer";
import { uploadContentToS3 } from "../_helpers/uploadFileToS3";
import { Material } from "../models/schemas/material.schema";
import { KnowledgeDocument } from "../models/schemas/knowledge-document.schema";

export const vectorizeMaterialAndUpdateMaterialStatus = async (
  materialId: Types.ObjectId,
) => {
  await connectDatabase();
  const material = await Material.findById(materialId);
  if (!material) {
    console.error(`Materiale con ID ${materialId} non trovato`);
    return;
  }
  const documentUrl = material.url!;
  const buffer = await fetchBuffer(documentUrl);
  const ext = material.extension!;
  const textExtracted = await extractTextFromFile(buffer, ext);
  const vectorizeParams: VectorizeDocumentParams = {
    materialId: materialId,
    subjectId: material.subjectId,
    teacherId: material.teacherId,
    documentText: textExtracted,
  };
  await vectorizeDocumentWithGemini(vectorizeParams);
  let extractedTextFileUrl = await uploadContentToS3('extracted-text' + material._id.toString() + '.txt', textExtracted, 'text/plain')
  material.vectorized = true;
  material.extractedTextFileUrl = extractedTextFileUrl;
  await material.save()
};

export const vectorizeKnowledgeDocumentAndUpdateStatus = async (
  documentId: Types.ObjectId,
) => {
  await connectDatabase();
  const doc = await KnowledgeDocument.findById(documentId);
  if (!doc) {
    console.error(`Documento Knowledge con ID ${documentId} non trovato`);
    return;
  }
  const documentUrl = doc.url!;
  const buffer = await fetchBuffer(documentUrl);
  const ext = doc.extension!;
  const textExtracted = await extractTextFromFile(buffer, ext);
  
  await vectorizeKnowledgeManualWithGemini({
    documentId: documentId,
    documentText: textExtracted,
    role: doc.role as any
  });

  let extractedTextFileUrl = await uploadContentToS3('knowledge-text' + doc._id.toString() + '.txt', textExtracted, 'text/plain')
  doc.vectorized = true;
  doc.extractedTextFileUrl = extractedTextFileUrl;
  await doc.save();
};

export const startIndexingJob = async (id: Types.ObjectId) => {
  if (!process.env.INDEXING_QUEUE_URL) {
    // If no queue is configured, try to process directly (fallback)
    await connectDatabase();
    const material = await Material.findById(id);
    if (material) {
        await vectorizeMaterialAndUpdateMaterialStatus(id);
    } else {
        await vectorizeKnowledgeDocumentAndUpdateStatus(id);
    }
    return;
  }
  const sqsClient = new SQSClient();
  const body: SendMessageCommandInput = {
    QueueUrl: process.env.INDEXING_QUEUE_URL,
    MessageBody: id.toString(),
  };
  await sqsClient.send(new SendMessageCommand(body));
};

export const handler: SQSHandler = async (event: SQSEvent) => {
  if (event.Records.length == 0) return;
  await connectDatabase();
  
  for (const record of event.Records) {
    const idStr = record.body;
    if (!idStr) continue;
    
    const id = new mongo.ObjectId(idStr);
    
    // Check if it's a Material
    const material = await Material.findById(id);
    if (material) {
      console.log(`Processing Material vectorization: ${idStr}`);
      await vectorizeMaterialAndUpdateMaterialStatus(id);
      continue;
    }
    
    // Check if it's a KnowledgeDocument
    const knowledgeDoc = await KnowledgeDocument.findById(id);
    if (knowledgeDoc) {
      console.log(`Processing KnowledgeDocument vectorization: ${idStr}`);
      await vectorizeKnowledgeDocumentAndUpdateStatus(id);
      continue;
    }
    
    console.warn(`ID ${idStr} not found in Material or KnowledgeDocument collections.`);
  }
};
