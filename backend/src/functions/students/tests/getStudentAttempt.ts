import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Attempt } from "../../../models/schemas/attempt.schema";

const getStudentAttempt = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;
  const studentId = context.user?._id;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  if (!studentId) {
    throw createError.Unauthorized("User not authenticated");
  }

  await connectDatabase();

  const attempt = await Attempt.findOne({
    testId: new mongo.ObjectId(testId),
    studentId: new mongo.ObjectId(studentId),
  }).sort({ _id: -1 });

  console.log("Attempt found:", attempt);

  return { attempt: attempt ?? null };
};

export const handler = lambdaRequest(getStudentAttempt);
