import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { Test } from "../../models/schemas/test.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const deleteTest = async (request: APIGatewayProxyEvent, context: Context) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  await connectDatabase();

  // Verifica che il test esista e appartenga al teacher
  const existingTest = await Test.findOne({
    _id: new mongo.ObjectId(testId),
    teacherId: context.user?._id,
  });

  if (!existingTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  // Elimina il test
  await Test.deleteOne({
    _id: new mongo.ObjectId(testId),
    teacherId: context.user?._id,
  });

  return {
    success: true,
    message: "Test deleted successfully",
  };
};

export const handler = lambdaRequest(deleteTest);
