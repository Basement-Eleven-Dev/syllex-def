import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

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

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Verify test exists and belongs to the teacher
  const existingTest = await testsCollection.findOne({
    _id: new ObjectId(testId),
    teacherId: context.user?._id,
  });

  if (!existingTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  // Update classIds
  const result = await testsCollection.updateOne(
    { _id: new ObjectId(testId) },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new ObjectId(id)),
        updatedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw createError.InternalServerError("Failed to update test classes");
  }

  // Return updated test
  const updatedTest = await testsCollection.findOne({
    _id: new ObjectId(testId),
  });

  return {
    success: true,
    test: updatedTest,
  };
};

export const handler = lambdaRequest(updateTestClasses);
