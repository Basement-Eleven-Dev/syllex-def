import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const getClassAssignedTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;
  const subjectId = request.pathParameters?.subjectId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  if (!subjectId) {
    throw createError.BadRequest("subjectId is required");
  }

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Find tests that have the specified classId in their classIds array
  // and match the specified subjectId
  const tests = await testsCollection
    .find({
      classIds: new ObjectId(classId),
      subjectId: new ObjectId(subjectId),
    })
    .toArray();

  return {
    tests,
  };
};

export const handler = lambdaRequest(getClassAssignedTests);
