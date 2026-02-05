import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { S3Event, S3Handler } from "aws-lambda";
import { getDefaultDatabase } from "../_helpers/getDatabase";

export const handler: S3Handler = async (event: S3Event) => {
    const s3Client = new S3Client({});
    const db = await getDefaultDatabase();

    // S3 events can contain multiple records
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        try {
            // 1. Get metadata from S3 (where we stored the 'folder')
            const head = await s3Client.send(new HeadObjectCommand({
                Bucket: bucket,
                Key: key
            }));

            // 2. Prepare the document
            const document = {
                filename: key,
                s3Url: `https://${bucket}.s3.amazonaws.com/${key}`,
                folder: head.Metadata?.["original-folder"] || "root",
                size: record.s3.object.size,
                uploadedAt: new Date(),
                contentType: head.ContentType
            };

            // 3. Save to MongoDB
            await db.collection("files").insertOne(document);
            console.log(`Indexed: ${key}`);

        } catch (err) {
            console.error(`Error processing ${key}:`, err);
            // If it fails here, S3 can retry based on your Lambda's retry policy
        }
    }
};