import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Test } from "../../models/schemas/test.schema";

const getTestById = async (request: APIGatewayProxyEvent, context: Context) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  await connectDatabase();

  // Recupera il test (solo se appartiene al teacher loggato)
  const test = await Test.findOne({
    _id: new mongo.ObjectId(testId),
    teacherId: context.user?._id,
  }).lean();

  if (!test) {
    throw createError.NotFound("Test not found or not authorized");
  }

  return {
    test,
  };
};

export const handler = lambdaRequest(getTestById);
