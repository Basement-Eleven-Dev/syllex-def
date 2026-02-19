import { APIGatewayProxyEvent } from "aws-lambda";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createError from "http-errors";
import { ObjectId } from "mongodb";
import { correctStudentQuestion } from "../../_helpers/AI/correctStudentQuestion";

const correctAttemptWithAI = async (request: APIGatewayProxyEvent) => {
  const attemptId = request.pathParameters?.attemptId;
  const questionId = request.pathParameters?.questionId;

  if (!attemptId || !ObjectId.isValid(attemptId)) {
    throw createError.BadRequest("ID tentativo non valido o mancante");
  }
  if (!questionId || !ObjectId.isValid(questionId)) {
    throw createError.BadRequest("ID domanda non valido o mancante");
  }

  const db = await getDefaultDatabase();

  // 1. Recupero del tentativo per ottenere il testId e la risposta dello studente
  const attempt = await db.collection("attempts").findOne({
    _id: new ObjectId(attemptId),
  });

  if (!attempt) throw createError.NotFound("Tentativo non trovato");

  // 2. Recupero del Test per ottenere il punteggio massimo (points) configurato
  const test = await db.collection("tests").findOne({
    _id: new ObjectId(attempt.testId),
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
  const { score, explanation } = await correctStudentQuestion(
    question.answer,
    maxScore,
    question.question.explanation,
  );

  // 6. Update Atomico del tentativo
  await db.collection("attempts").updateOne(
    { _id: new ObjectId(attemptId) },
    {
      $set: {
        [`questions.${questionIndex}.score`]: score,
        [`questions.${questionIndex}.teacherComment`]: explanation,
        [`questions.${questionIndex}.status`]: score > 0 ? "correct" : "wrong",
        updatedAt: new Date(),
      },
    },
  );

  return {
    success: true,
    score,
    explanation,
    maxScore, // Lo restituiamo per debug o UI
  };
};

export const handler = lambdaRequest(correctAttemptWithAI);
