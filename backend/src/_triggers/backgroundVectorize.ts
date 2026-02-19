import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { S3Event, S3Handler, SQSEvent, SQSHandler } from "aws-lambda";
import { getDefaultDatabase } from "../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient, } from "@aws-sdk/client-sqs"
export const startIndexingJob = async (materialId: ObjectId) => {
    if (!process.env.INDEXING_QUEUE_URL) {
        //index call Giulia Function;
        const db = await getDefaultDatabase();
        await db.collection('materials').updateOne({ _id: materialId }, { $set: { vectorized: true } })
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
    //index - call Giulia function
    const db = await getDefaultDatabase();
    await db.collection('materials').updateOne({ _id: materialId }, { $set: { vectorized: true } })
};