import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Test } from "../../models/test";

const createTest = async (request: APIGatewayProxyEvent, context: Context) => {
  const testData = JSON.parse(request.body || "{}");

  if (!testData.subjectId) {
    throw createError.BadRequest("subjectId is required");
  }

  if (!context.user?._id) {
    throw createError.Unauthorized("User not authenticated");
  }

  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Prepara il test da inserire
  const newTest: any = {
    name: testData.name,
    availableFrom: new Date(testData.availableFrom),
    classIds: testData.classIds.map((id: string) => new ObjectId(id)),
    questions: testData.questions.map(
      (q: { questionId: string; points: number }) => ({
        questionId: new ObjectId(q.questionId),
        points: q.points,
      }),
    ),
    fitScore: testData.fitScore || 0,
    teacherId: context.user._id,
    subjectId: new ObjectId(testData.subjectId),
    status: testData.status || "bozza",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Aggiungi campi opzionali solo se definiti
  if (testData.availableTo) {
    newTest.availableTo = new Date(testData.availableTo);
  }

  if (testData.password) {
    newTest.password = testData.password;
  }

  if (testData.timeLimit !== null && testData.timeLimit !== undefined) {
    newTest.timeLimit = testData.timeLimit;
  }

  const result = await testsCollection.insertOne(newTest as Test);

  return {
    test: {
      ...newTest,
      _id: result.insertedId,
    },
  };
};

export const handler = lambdaRequest(createTest);
