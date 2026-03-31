import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { Types, mongo } from "mongoose";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { sanitizeAttemptQuestions } from "../tests/_helpers";
import { Question } from "../../../models/schemas/question.schema";
import { Test } from "../../../models/schemas/test.schema";
import { Attempt } from "../../../models/schemas/attempt.schema";

const createSelfEvaluationTest = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) throw createError.Unauthorized("User not authenticated");

  const {
    name = "Auto-valutazione",
    subjectId,
    topicIds,
    questionCount = 10,
    excludedTypes = [],
    timeLimit,
  } = JSON.parse(request.body || "{}");

  if (!subjectId || !Array.isArray(topicIds) || topicIds.length === 0) {
    throw createError.BadRequest("subjectId e topicIds sono obbligatori");
  }

  await connectDatabase();

  // 1. Recupero domande filtrate per materia, argomenti e tipologie
  const topicObjectIds = topicIds.map((id: string) => new mongo.ObjectId(id));
  const subjectObjectId = new mongo.ObjectId(subjectId);

  const questions = await Question
    .find({
      subjectId: subjectObjectId,
      topicId: { $in: topicObjectIds },
      ...(excludedTypes.length > 0 && { type: { $nin: excludedTypes } }),
    })

  if (questions.length === 0) {
    throw createError.UnprocessableEntity(
      "Nessuna domanda trovata per i criteri selezionati",
    );
  }

  // 2. Shuffle e selezione delle N domande richieste
  const shuffled = questions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, questionCount);

  const now = new Date();

  // 3. Creazione del test di auto-valutazione
  const testResult = await Test.insertOne({
    name: String(name).trim() || "Auto-valutazione",
    source: "self-evaluation",
    studentId: new mongo.ObjectId(studentId),
    teacherId: new mongo.ObjectId(studentId), // required field — student acts as owner
    subjectId: subjectObjectId,
    classIds: [],
    questions: selected.map((q) => ({ questionId: q._id, points: 1 })),
    status: "pubblicato",
    fitScore: 1,
    maxScore: selected.length,
    ...(timeLimit && { timeLimit: Number(timeLimit) }),
    createdAt: now,
    updatedAt: now,
  });

  const testId = testResult._id;

  // 4. Creazione dell'attempt direttamente in-progress con le domande embedded
  const attemptQuestions = sanitizeAttemptQuestions(
    selected.map((q) => ({ question: q, answer: null, points: 1 })),
  );

  const attemptResult = await Attempt.insertOne({
    testId,
    source: "self-evaluation",
    subjectId: subjectObjectId,
    teacherId: new mongo.ObjectId(studentId),
    studentId: new mongo.ObjectId(studentId),
    status: "in-progress",
    startedAt: now,
    maxScore: selected.length,
    score: undefined,
    fitTestScore: undefined,
    questions: attemptQuestions,
  });

  return {
    success: true,
    testId: testId.toString(),
    attemptId: attemptResult._id.toString(),
  };
};

export const handler = lambdaRequest(createSelfEvaluationTest);
