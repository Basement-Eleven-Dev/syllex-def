import { PutObjectCommand, PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import { BUCKET_NAME } from "../../environment";

export const uploadPlainContentToS3 = async (
    key: string,
    content: string,
    mimeType: string,
): Promise<string | undefined> => {

    const s3Client = new S3Client();

    const params: PutObjectCommandInput = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: mimeType
    };

    try {
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);

        console.log(`File uploaded successfully. ETag: ${response.ETag}`);
        return `https://${BUCKET_NAME}.s3.eu-south-1.amazonaws.com/${key}`
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}