import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import createError from "http-errors";
import { sendEmail } from "../../_helpers/email/sendEmail";
import { testCorrectedEmail } from "../../_helpers/email/emailTemplates";
import { Attempt } from "../../models/schemas/attempt.schema";
import { Subject } from "../../models/schemas/subject.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const correctAttempt = async (request: APIGatewayProxyEvent, context: Context) => {
  const attemptId = request.pathParameters?.attemptId;
  const body = JSON.parse(request.body || "{}");

  if (!attemptId) throw createError.BadRequest("ID tentativo mancante");

  await connectDatabase();

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
    filter[`${identifier}.question._id`] = new mongo.ObjectId(q.questionId);
    arrayFilters.push(filter);
  });

  // 3. Eseguiamo un'unica operazione di update senza aver mai fatto una "find"
  const result = await Attempt
    .updateOne({ _id: new mongo.ObjectId(attemptId) }, updateQuery, { arrayFilters });

  if (result.matchedCount === 0) {
    throw createError.NotFound("Tentativo non trovato");
  }

  // 4. Notifica email allo studente (asincrono, non blocca la risposta)
  try {
    const teacher = context.user;
    console.log("[Notify] Controllo preferenze docente:", teacher?.notificationSettings);
    if (teacher?.notificationSettings?.testCorrected) {
      console.log("[Notify] Preferenza attiva, recupero dettagli per attempt:", attemptId);
      const attempt = await Attempt.aggregate([
        { $match: { _id: new mongo.ObjectId(attemptId) } },
        { $lookup: { from: "tests", localField: "testId", foreignField: "_id", as: "test" } },
        { $unwind: "$test" },
        { $lookup: { from: "users", localField: "studentId", foreignField: "_id", as: "student" } },
        { $unwind: "$student" },
      ]);

      console.log(`[Notify] Risultato aggregate: ${attempt.length} documenti trovati`);
      if (attempt[0]) {
        const att = attempt[0];
        const studentEmail = att.student.username || att.student.email;
        console.log(`[Notify] Email studente trovata: ${studentEmail}`);

        // Recupera nome materia
        const subjectDoc = await Subject.findOne({ _id: att.test.subjectId });
        console.log(`[Notify] Materia trovata: ${subjectDoc?.name}`);
        const subjectName = subjectDoc?.name || "Materia";

        const teacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
        const maxScore = att.test.maxScore || 0;
        const scoreStr = maxScore > 0 ? `${body.score}/${maxScore}` : undefined;

        const { subject, html } = testCorrectedEmail({
          teacherName,
          testTitle: att.test.name,
          subjectName,
          score: scoreStr,
        });

        if (studentEmail) {
          await sendEmail(studentEmail, subject, html);
          console.log(`[Notify] Email correzione inviata a ${studentEmail}`);
        }
      }
    }
  } catch (notifyError) {
    console.error("[Notify] Errore notifica correzione:", notifyError);
  }

  return {
    success: true,
    message: "Correzione salvata con successo tramite update atomico!",
  };
};

export const handler = lambdaRequest(correctAttempt);
