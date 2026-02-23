import { SQSEvent, SQSHandler } from "aws-lambda";
import { getDefaultDatabase } from "../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import {
  SendMessageCommand,
  SendMessageCommandInput,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { extractTextFromFile } from "../_helpers/documents/extractTextFromFile";
import {
  vectorizeDocument,
  VectorizeDocumentParams,
  vectorizeDocumentWithGemini,
} from "../_helpers/AI/embeddings/vectorizeDocument";
import { fetchBuffer } from "../_helpers/fetchBuffer";

export const vectorizeMaterialAndUpdateMaterialStatus = async (
  materialId: ObjectId,
) => {
  const db = await getDefaultDatabase();
  const material = await db
    .collection("materials")
    .findOne({ _id: materialId });
  if (!material) {
    console.error(`Materiale con ID ${materialId} non trovato`);
    return;
  }
  const documentUrl = material.url;
  const buffer = await fetchBuffer(documentUrl);
  const ext = material.extension;
  const textExtracted = await extractTextFromFile(buffer, ext);
  const vectorizeParams: VectorizeDocumentParams = {
    materialId: materialId.toString(),
    subjectId: material.subjectId,
    teacherId: material.teacherId,
    documentText: textExtracted,
  };
  await vectorizeDocumentWithGemini(vectorizeParams);

  await db
    .collection("materials")
    .updateOne({ _id: materialId }, { $set: { vectorized: true } });
};

export const startIndexingJob = async (materialId: ObjectId) => {
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
  let materialId: ObjectId = new ObjectId(event.Records[0].body as string);
  await vectorizeMaterialAndUpdateMaterialStatus(materialId);
};
