import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { ObjectId } from "mongodb";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { sanitizeAttemptQuestions } from "../tests/_helpers";

const createSelfEvaluationTest = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) throw createError.Unauthorized("User not authenticated");

  const {
    subjectId,
    topicIds,
    questionCount = 10,
    excludedTypes = [],
    timeLimit,
  } = JSON.parse(request.body || "{}");

  if (!subjectId || !Array.isArray(topicIds) || topicIds.length === 0) {
    throw createError.BadRequest("subjectId e topicIds sono obbligatori");
  }

  const db = await getDefaultDatabase();

  // 1. Recupero domande filtrate per materia, argomenti e tipologie
  const topicObjectIds = topicIds.map((id: string) => new ObjectId(id));
  const subjectObjectId = new ObjectId(subjectId);

  const questions = await db
    .collection("questions")
    .find({
      subjectId: subjectObjectId,
      topicId: { $in: topicObjectIds },
      ...(excludedTypes.length > 0 && { type: { $nin: excludedTypes } }),
    })
    .toArray();

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
  const testResult = await db.collection("tests").insertOne({
    name: `Auto-valutazione`,
    source: "self-evaluation",
    studentId: new ObjectId(studentId),
    teacherId: new ObjectId(studentId), // required field — student acts as owner
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

  const testId = testResult.insertedId;

  // 4. Creazione dell'attempt direttamente in-progress con le domande embedded
  const attemptQuestions = sanitizeAttemptQuestions(
    selected.map((q) => ({ question: q, answer: null, points: 1 })),
  );

  const attemptResult = await db.collection("attempts").insertOne({
    testId,
    source: "self-evaluation",
    subjectId: subjectObjectId,
    teacherId: new ObjectId(studentId),
    studentId: new ObjectId(studentId),
    status: "in-progress",
    startedAt: now,
    questions: attemptQuestions,
    maxScore: selected.length,
    score: null,
    fitTestScore: null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    testId: testId.toString(),
    attemptId: attemptResult.insertedId.toString(),
  };
};

export const handler = lambdaRequest(createSelfEvaluationTest);
