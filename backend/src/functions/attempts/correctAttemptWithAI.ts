import { APIGatewayProxyEvent } from "aws-lambda";
import { connectDatabase } from "../../_helpers/getDatabase";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createError from "http-errors";
import { Types, mongo } from "mongoose";
import { correctStudentQuestion } from "../../_helpers/AI/correctStudentQuestion";
import { Attempt } from "../../models/schemas/attempt.schema";
import { Test } from "../../models/schemas/test.schema";

const correctAttemptWithAI = async (request: APIGatewayProxyEvent) => {
  const attemptId = request.pathParameters?.attemptId;
  const questionId = request.pathParameters?.questionId;

  if (!attemptId || !mongo.ObjectId.isValid(attemptId)) {
    throw createError.BadRequest("ID tentativo non valido o mancante");
  }
  if (!questionId || !mongo.ObjectId.isValid(questionId)) {
    throw createError.BadRequest("ID domanda non valido o mancante");
  }

  await connectDatabase();

  // 1. Recupero del tentativo per ottenere il testId e la risposta dello studente
  const attempt = await Attempt.findOne({
    _id: new mongo.ObjectId(attemptId),
  });

  if (!attempt) throw createError.NotFound("Tentativo non trovato");

  // 2. Recupero del Test per ottenere il punteggio massimo (points) configurato
  const test = await Test.findOne({
    _id: new mongo.ObjectId(attempt.testId),
  });

  if (!test) throw createError.NotFound("Test associato non trovato");

  // 3. Ricerca della configurazione punti nel Test
  const testQuestionConfig = test.questions.find(
    (tq: any) => tq.questionId.toString() === questionId,
  );

  const maxScore = testQuestionConfig?.points ?? 1;

  // 4. Ricerca della domanda specifica nel tentativo per avere la risposta
  const questionIndex = attempt.questions.findIndex(
    (q: any) => q.question._id.toString() === questionId,
  );

  if (questionIndex === -1)
    throw createError.NotFound("Domanda non trovata nel tentativo");

  const question = attempt.questions[questionIndex];

  // 5. Chiamata all'AI con il maxScore reale preso dal Test
  const { score, explanation, aiProbability } = await correctStudentQuestion(
    question.answer || '',
    maxScore,
    question.question.explanation || '',
  );

  // 6. Update Atomico del tentativo
  await Attempt.updateOne(
    { _id: new mongo.ObjectId(attemptId) },
    {
      $set: {
        [`questions.${questionIndex}.score`]: score,
        [`questions.${questionIndex}.teacherComment`]: explanation,
        [`questions.${questionIndex}.status`]: score >= (maxScore / 2) ? "correct" : "wrong",
        [`questions.${questionIndex}.aiProbability`]: aiProbability,
        updatedAt: new Date(),
      },
    },
  );

  return {
    success: true,
    score,
    explanation,
    maxScore, // Lo restituiamo per debug o UI
    aiProbability
  };
};

export const handler = lambdaRequest(correctAttemptWithAI);
