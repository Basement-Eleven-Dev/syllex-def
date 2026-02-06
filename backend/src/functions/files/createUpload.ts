import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createError from 'http-errors'
import { BUCKET_NAME } from "../../../environment";



const generateUploadUrl = async (request: APIGatewayProxyEvent, context: Context) => {
    const s3Client = new S3Client({});
    // Since it's a proxy, body is a string
    const body = JSON.parse(request.body || "{}");
    const { filename, contentType, ...metadata } = body;

    if (!filename) {
        throw createError.BadRequest("filename is required");
    }

    // Configuration for the upload
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename, // Stored in root as requested
        ContentType: contentType || "application/octet-stream",
        Metadata: metadata
    });

    // Generate a URL that expires in 5 minutes (300 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return {
        uploadUrl: presignedUrl,
        key: filename
    }

};

export const handler = lambdaRequest(generateUploadUrl)