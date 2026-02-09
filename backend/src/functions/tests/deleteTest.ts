import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const deleteTest = async (request: APIGatewayProxyEvent, context: Context) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Verifica che il test esista e appartenga al teacher
  const existingTest = await testsCollection.findOne({
    _id: new ObjectId(testId),
    teacherId: context.user?._id,
  });

  if (!existingTest) {
    throw createError.NotFound("Test not found or not authorized");
  }

  // Elimina il test
  await testsCollection.deleteOne({
    _id: new ObjectId(testId),
    teacherId: context.user?._id,
  });

  return {
    success: true,
    message: "Test deleted successfully",
  };
};

export const handler = lambdaRequest(deleteTest);
