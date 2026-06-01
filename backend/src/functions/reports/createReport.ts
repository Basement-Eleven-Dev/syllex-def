import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Report } from "../../models/schemas/report.schema";

const createReport = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const userId = context.user?._id;

  if (!userId) {
    throw createError.Unauthorized("User ID is required");
  }

  const body = JSON.parse(request.body || "{}");
  const { comment, url, userAgent } = body;
  const subjectId = context.subjectId;

  if (!comment) {
    throw createError.BadRequest("comment is required");
  }

  await connectDatabase();

  const newReport = {
    teacherId: userId, // Maintains compatibility with existing schema field name
    subjectId: subjectId || undefined,
    comment,
    url: url || undefined,
    userAgent: userAgent || undefined,
    status: "open", // Correct enum value, instead of 'pending'
    createdAt: new Date(),
  };

  const result = await Report.insertOne(newReport);

  return {
    success: true,
    reportId: result._id,
    message: "Report created successfully",
  };
};

export const handler = lambdaRequest(createReport);
