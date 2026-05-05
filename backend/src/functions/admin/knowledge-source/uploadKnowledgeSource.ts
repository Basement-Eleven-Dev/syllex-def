import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import createError from "http-errors";
import { BUCKET_NAME, AWS_REGION } from "../../../../environment";

const generateKnowledgeUploadUrl = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const s3Client = new S3Client({ region: AWS_REGION });
  const body = JSON.parse(request.body || "{}");

  const { filename, contentType } = body;

  if (!filename) {
    throw createError.BadRequest("filename is required");
  }

  // Use a dedicated folder for knowledge base files
  const key = `knowledge/${Date.now()}_${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  // Calculate the public URL (S3 bucket URL)
  // Assuming standard S3 URL format: https://bucket-name.s3.region.amazonaws.com/key
  const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl: presignedUrl,
    key: key,
    url: publicUrl
  };
};

export const handler = lambdaRequest(generateKnowledgeUploadUrl);
