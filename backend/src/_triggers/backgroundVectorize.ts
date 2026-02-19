import { SQSEvent, SQSHandler } from "aws-lambda";
import { getDefaultDatabase } from "../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient, } from "@aws-sdk/client-sqs"

export const vectorizeMaterialAndUpdateMaterialStatus = async (materialId: ObjectId) => {

    //index call Giulia Function;
    const db = await getDefaultDatabase();
    await db.collection('materials').updateOne({ _id: materialId }, { $set: { vectorized: true } })
}

export const startIndexingJob = async (materialId: ObjectId) => {
    if (!process.env.INDEXING_QUEUE_URL) {
        await vectorizeMaterialAndUpdateMaterialStatus(materialId);
        return;
    }
    const sqsClient = new SQSClient();
    const body: SendMessageCommandInput = {
        QueueUrl: process.env.INDEXING_QUEUE_URL,
        MessageBody: materialId.toString()
    }
    await sqsClient.send(new SendMessageCommand(body))
}

export const handler: SQSHandler = async (event: SQSEvent) => {
    if (event.Records.length == 0) return;
    let materialId: ObjectId = new ObjectId(event.Records[0].body as string);
    await vectorizeMaterialAndUpdateMaterialStatus(materialId)
};