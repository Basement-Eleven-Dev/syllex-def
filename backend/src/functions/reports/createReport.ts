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
  const teacherId = context.user?._id;

  if (!teacherId) {
    throw createError.Unauthorized("Teacher ID is required");
  }

  const body = JSON.parse(request.body || "{}");
  const { comment, url, userAgent } = body;
  const subjectId = context.subjectId;

  if (!subjectId || !comment) {
    throw createError.BadRequest("subjectId and comment are required");
  }

  await connectDatabase();

  const newReport = {
    teacherId: teacherId,
    subjectId: subjectId,
    comment,
    url: url || undefined,
    userAgent: userAgent || undefined,
    status: "pending",
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
