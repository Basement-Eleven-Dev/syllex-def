import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose"; import { connectDatabase } from "../../_helpers/getDatabase";
import { Test } from "../../models/schemas/test.schema";
;

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

  await connectDatabase();

  const existingTest = await Test.findOne({
    _id: new mongo.ObjectId(testId),
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

  const result = await Test.insertOne(duplicatedTest);

  return {
    test: result
  };
};

export const handler = lambdaRequest(duplicateTest);
