import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { mongo } from "mongoose";
import { Attempt } from "../../../models/schemas/attempt.schema";

/**
 * Versione BATCH di getStudentAttempt: dato un array di testId, ritorna per
 * ciascuno il tentativo PIÙ RECENTE dello studente, in UNA sola query.
 * Sostituisce la cascata di N chiamate `GET test/{testId}/attempt` lanciate
 * da dashboard e lista test al login.
 *
 * Payload leggero: ritorna solo i campi che i due consumer usano davvero
 * (status, score, maxScore, e per ogni domanda score/points/status). Niente
 * populate del materiale (serve solo nelle pagine di esecuzione/revisione,
 * che continuano a usare l'endpoint singolo).
 *
 * Risposta: { attempts: { [testId]: {...} } }
 */

const MAX_TEST_IDS = 1000;

const getStudentAttemptsBatch = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    throw createError.Unauthorized("User not authenticated");
  }

  const body = JSON.parse(request.body || "{}");
  const rawIds: unknown = Array.isArray(body) ? body : body.testIds;

  if (!Array.isArray(rawIds)) {
    throw createError.BadRequest("An array of testIds is required");
  }

  // Tieni solo ObjectId validi, deduplica, limita.
  const ids = Array.from(
    new Set(rawIds.filter((id): id is string => typeof id === "string")),
  )
    .filter((id) => mongo.ObjectId.isValid(id))
    .slice(0, MAX_TEST_IDS)
    .map((id) => new mongo.ObjectId(id));

  if (ids.length === 0) {
    return { attempts: {} };
  }

  await connectDatabase();

  const rows = await Attempt.find(
    {
      studentId: new mongo.ObjectId(studentId),
      testId: { $in: ids },
    },
    {
      testId: 1,
      status: 1,
      score: 1,
      maxScore: 1,
      "questions.score": 1,
      "questions.points": 1,
      "questions.status": 1,
    },
  )
    .sort({ _id: -1 }) // più recente prima
    .lean();

  // Per ogni test tieni SOLO il tentativo più recente (primo, dato il sort desc).
  const attempts: Record<string, any> = {};
  for (const row of rows) {
    const tid = String(row.testId);
    if (!attempts[tid]) {
      attempts[tid] = {
        testId: tid,
        status: row.status,
        score: row.score,
        maxScore: row.maxScore,
        questions: (row.questions ?? []).map((q: any) => ({
          score: q.score,
          points: q.points,
          status: q.status,
        })),
      };
    }
  }

  return { attempts };
};

export const handler = lambdaRequest(getStudentAttemptsBatch);
