import { APIGatewayProxyEvent } from "aws-lambda";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { ObjectId } from "mongodb";
import createError from "http-errors";

const correctAttempt = async (request: APIGatewayProxyEvent) => {
  const attemptId = request.pathParameters?.attemptId;
  const body = JSON.parse(request.body || "{}");

  if (!attemptId) throw createError.BadRequest("ID tentativo mancante");

  const db = await getDefaultDatabase();

  // Creiamo l'oggetto per l'aggiornamento dinamico
  // 1. Aggiorniamo i campi di primo livello (status e score totale)
  const updateQuery: any = {
    $set: {
      status: body.status,
      score: body.score,
      updatedAt: new Date(),
    },
  };

  // 2. Creiamo i filtri per aggiornare ogni singola domanda nell'array
  const arrayFilters: any[] = [];

  body.questions.forEach((q: any, index: number) => {
    const identifier = `q${index}`; // Es: q0, q1, q2...

    // Settiamo i campi specifici usando l'identificatore
    updateQuery.$set[`questions.$[${identifier}].score`] = q.score;
    updateQuery.$set[`questions.$[${identifier}].teacherComment`] =
      q.teacherComment;
    updateQuery.$set[`questions.$[${identifier}].status`] =
      q.score > 0 ? "correct" : "wrong";

    // Definiamo a quale domanda corrisponde questo identificatore
    const filter: any = {};
    filter[`${identifier}.question._id`] = new ObjectId(q.questionId);
    arrayFilters.push(filter);
  });

  // 3. Eseguiamo un'unica operazione di update senza aver mai fatto una "find"
  const result = await db
    .collection("attempts")
    .updateOne({ _id: new ObjectId(attemptId) }, updateQuery, { arrayFilters });

  if (result.matchedCount === 0) {
    throw createError.NotFound("Tentativo non trovato");
  }

  return {
    success: true,
    message: "Correzione salvata con successo tramite update atomico!",
  };
};

export const handler = lambdaRequest(correctAttempt);
