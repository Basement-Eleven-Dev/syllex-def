import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const duplicateTest = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  if (!context.user?._id) {
    throw createError.Unauthorized("User not authenticated");
  }

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  const existingTest = await testsCollection.findOne({
    _id: new ObjectId(testId),
    teacherId: context.user._id,
  });

  if (!existingTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  const { _id, createdAt, updatedAt, ...testData } = existingTest as any;

  const duplicatedTest: any = {
    ...testData,
    name: `${existingTest.name} (copia)`,
    status: "bozza",
    classIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await testsCollection.insertOne(duplicatedTest as Test);

  return {
    test: {
      ...duplicatedTest,
      _id: result.insertedId,
    },
  };
};

export const handler = lambdaRequest(duplicateTest);
