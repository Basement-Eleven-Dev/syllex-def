import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const editTest = async (request: APIGatewayProxyEvent, context: Context) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  const testData = JSON.parse(request.body || "{}");

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

  // Prepara i dati per l'update
  const updateData: any = { updatedAt: new Date() };

  if (testData.name) updateData.name = testData.name;
  if (testData.status) updateData.status = testData.status;
  if (testData.availableFrom)
    updateData.availableFrom = new Date(testData.availableFrom);
  if (testData.availableTo)
    updateData.availableTo = new Date(testData.availableTo);
  if (testData.classIds)
    updateData.classIds = testData.classIds.map(
      (id: string) => new ObjectId(id),
    );
  if (testData.password) updateData.password = testData.password;
  if (testData.questions)
    updateData.questions = testData.questions.map(
      (q: { questionId: string; points: number }) => ({
        questionId: new ObjectId(q.questionId),
        points: q.points,
      }),
    );
  if (testData.fitScore !== undefined) updateData.fitScore = testData.fitScore;
  if (testData.timeLimit) updateData.timeLimit = testData.timeLimit;
  if (testData.subjectId)
    updateData.subjectId = new ObjectId(testData.subjectId);

  const result = await testsCollection.findOneAndUpdate(
    { _id: new ObjectId(testId), teacherId: context.user?._id },
    { $set: updateData },
    { returnDocument: "after" },
  );

  if (!result) {
    throw createError.InternalServerError("Failed to update test");
  }

  return {
    test: result,
  };
};

export const handler = lambdaRequest(editTest);
