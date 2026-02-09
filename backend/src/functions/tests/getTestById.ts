import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const getTestById = async (request: APIGatewayProxyEvent, context: Context) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Recupera il test (solo se appartiene al teacher loggato)
  const test = await testsCollection.findOne({
    _id: new ObjectId(testId),
    teacherId: context.user?._id,
  });

  if (!test) {
    throw createError.NotFound("Test not found or not authorized");
  }

  return {
    test,
  };
};

export const handler = lambdaRequest(getTestById);
