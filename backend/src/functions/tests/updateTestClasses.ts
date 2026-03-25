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
  const testId = request.pathParameters!.testId!;

  const body = JSON.parse(request.body || "{}");

  if (!Array.isArray(body.classIds)) {
    throw createError.BadRequest("classIds must be an array");
  }

  await connectDatabase();

  // Update classIds atomically and return updated doc
  const updatedTest = await Test.findOneAndUpdate(
    { _id: new mongo.ObjectId(testId), teacherId: context.user?._id },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new mongo.ObjectId(id)),
        updatedAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  return {
    success: true,
    test: updatedTest,
  };
};

export const handler = lambdaRequest(updateTestClasses);
