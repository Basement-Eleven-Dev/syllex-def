import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { notifyStudentsIfEnabled } from "../../_helpers/email/notifyStudents";
import { newTestEmail } from "../../_helpers/email/emailTemplates";
import { Test } from "../../models/schemas/test.schema";
import { Subject } from "../../models/schemas/subject.schema";

const createTest = async (request: APIGatewayProxyEvent, context: Context) => {
  const testData = JSON.parse(request.body || "{}");

  if (!context.subjectId) {
    throw createError.BadRequest("subjectId is required");
  }

  if (!context.user?._id) {
    throw createError.Unauthorized("User not authenticated");
  }

  await connectDatabase();

  const computeMaxScore = (
    questions: { questionId: string; points: number }[],
  ) => {
    return questions.reduce((total, q) => total + q.points, 0);
  };

  // Prepara il test da inserire
  const newTest: any = {
    name: testData.name,
    availableFrom: new Date(testData.availableFrom),
    classIds: testData.classIds.map((id: string) => new mongo.ObjectId(id)),
    questions: testData.questions.map(
      (q: { questionId: string; points: number }) => ({
        questionId: new mongo.ObjectId(q.questionId),
        points: q.points,
      }),
    ),
    maxScore: computeMaxScore(testData.questions),
    fitScore: testData.fitScore || 0,
    teacherId: context.user._id,
    subjectId: context.subjectId,
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

  if (testData.randomizeQuestions === true) {
    newTest.randomizeQuestions = true;
  }

  if (testData.oneShotAnswers === true) {
    newTest.oneShotAnswers = true;
  }

  const result = await Test.insertOne(newTest);

  // Notifica email agli studenti (asincrono, non blocca la risposta)
  const teacherName = `${context.user?.firstName || ""} ${context.user?.lastName || ""}`.trim();

  // Recupera il nome della materia
  const subject_doc = await Subject
    .findOne({ _id: new mongo.ObjectId(context.subjectId) });
  const subjectName = subject_doc?.name || "Materia";

  const { subject, html } = newTestEmail({
    teacherName,
    testTitle: testData.name,
    subjectName,
    questionCount: testData.questions?.length,
  });
  console.log("prima del processo di notifica");
  notifyStudentsIfEnabled({
    teacher: context.user,
    preference: "newTest",
    classIds: newTest.classIds,
    subject,
    html,
  });

  return {
    test: {
      ...newTest,
      _id: result._id,
    },
  };
};

export const handler = lambdaRequest(createTest);
