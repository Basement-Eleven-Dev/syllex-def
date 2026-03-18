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
import { fetchBuffer } from "../_helpers/fetchBuffer";
import { uploadContentToS3 } from "../_helpers/uploadFileToS3";
import { Material } from "../models/schemas/material.schema";

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

export const startIndexingJob = async (materialId: Types.ObjectId) => {
  console.log(process.env, "enviroment");
  if (!process.env.INDEXING_QUEUE_URL) {
    await vectorizeMaterialAndUpdateMaterialStatus(materialId);
    return;
  }
  const sqsClient = new SQSClient();
  const body: SendMessageCommandInput = {
    QueueUrl: process.env.INDEXING_QUEUE_URL,
    MessageBody: materialId.toString(),
  };
  await sqsClient.send(new SendMessageCommand(body));
};

export const handler: SQSHandler = async (event: SQSEvent) => {
  if (event.Records.length == 0) return;
  let materialId: Types.ObjectId = new mongo.ObjectId(event.Records[0].body as string);
  await vectorizeMaterialAndUpdateMaterialStatus(materialId);
};
