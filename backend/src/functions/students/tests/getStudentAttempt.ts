import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Attempt } from "../../../models/attempt";

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

  const db = await getDefaultDatabase();
  const attemptsCollection = db.collection<Attempt>("attempts");

  const attempt = await attemptsCollection.findOne(
    {
      testId: new ObjectId(testId),
      studentId: new ObjectId(studentId),
    },
    { sort: { _id: -1 } },
  );

  return { attempt: attempt ?? null };
};

export const handler = lambdaRequest(getStudentAttempt);
