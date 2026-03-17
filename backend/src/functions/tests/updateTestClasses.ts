import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Test } from "../../models/schemas/test.schema";

const updateTestClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  const body = JSON.parse(request.body || "{}");

  if (!Array.isArray(body.classIds)) {
    throw createError.BadRequest("classIds must be an array");
  }

  await connectDatabase();

  // Verify test exists and belongs to the teacher
  const existingTest = await Test.findOne({
    _id: new mongo.ObjectId(testId),
    teacherId: context.user?._id,
  });

  if (!existingTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  // Update classIds
  const result = await Test.updateOne(
    { _id: new mongo.ObjectId(testId) },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new mongo.ObjectId(id)),
        updatedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw createError.InternalServerError("Failed to update test classes");
  }

  // Return updated test
  const updatedTest = await Test.findOne({
    _id: new mongo.ObjectId(testId),
  }).lean();

  return {
    success: true,
    test: updatedTest,
  };
};

export const handler = lambdaRequest(updateTestClasses);
