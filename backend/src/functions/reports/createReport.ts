import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Report } from "../../models/report";

const createReport = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;

  if (!teacherId) {
    throw createError.Unauthorized("Teacher ID is required");
  }

  const body = JSON.parse(request.body || "{}");
  const { subjectId, comment, url, userAgent } = body;

  if (!subjectId || !comment) {
    throw createError.BadRequest("subjectId and comment are required");
  }

  const db = await getDefaultDatabase();
  const reportsCollection = db.collection<Report>("reports");

  const newReport: Omit<Report, "_id"> = {
    teacherId: teacherId,
    subjectId: new ObjectId(subjectId),
    comment,
    url: url || undefined,
    userAgent: userAgent || undefined,
    status: "pending",
    createdAt: new Date(),
  };

  const result = await reportsCollection.insertOne(newReport as Report);

  return {
    success: true,
    reportId: result.insertedId,
    message: "Report created successfully",
  };
};

export const handler = lambdaRequest(createReport);
