import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Test } from "../../models/schemas/test.schema";

const getClassAssignedTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;
  const subjectId = context.subjectId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  if (!subjectId) {
    throw createError.BadRequest("subjectId is required");
  }

  await connectDatabase();

  // Find tests that have the specified classId in their classIds array
  // and match the specified subjectId
  const tests = await Test
    .find({
      classIds: new mongo.ObjectId(classId),
      subjectId: subjectId,
    })

  return {
    tests,
  };
};

export const handler = lambdaRequest(getClassAssignedTests);
