import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || !user._id) {
    return res
      .status(401)
      .json({ message: "Accesso negato: Utente non autenticato." });
  }
  if (user.role !== "teacher") {
    return res.status(403).json({
      message:
        "Accesso negato. Solo i docenti possono finalizzare le correzioni.",
    });
  }
  const teacherId = user._id;

  // L'ID della submission sarà un path param per coerenza REST
  const submissionId = req.queryStringParameters?.submissionId as string;
  const parsedBody = req.body ? JSON.parse(req.body) : {};
  const { answers: gradedAnswersFromTeacher } = parsedBody;

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return res.status(400).json({ message: "ID Svolgimento non valido." });
  }
  if (!gradedAnswersFromTeacher || !Array.isArray(gradedAnswersFromTeacher)) {
    return res
      .status(400)
      .json({ message: "Formato risposte aggiornate non valido." });
  }
  const submissionObjectId = new ObjectId(submissionId);

  let client;
  try {
    client = await mongoClient();
    const db: Db = client.db(DB_NAME);
    const submissionsCollection = db.collection("testsubmissions");
    const testsCollection = db.collection("tests");

    const submission = await submissionsCollection.findOne({
      _id: submissionObjectId,
    });
    if (!submission) {
      return res.status(404).json({ message: "Svolgimento test non trovato." });
    }
    if (submission.status === "ai-grading-in-progress") {
      console.warn(
        `[FinalizeGrading] Tentativo di finalizzare la submission ${submissionObjectId} mentre la correzione AI è in corso.`
      );
      return res.status(409).json({
        // 409 Conflict è uno status code appropriato qui
        message:
          "Impossibile finalizzare la correzione. Il processo di valutazione AI è ancora in corso. Riprova tra poco.",
      });
    }

    const originalTest = await testsCollection.findOne({
      _id: new ObjectId(submission.testId),
    });
    if (
      !originalTest ||
      originalTest.teacherId.toString() !== teacherId.toString()
    ) {
      return res.status(403).json({
        message: "Non sei autorizzato a correggere questo svolgimento.",
      });
    }

    let finalTotalScore = 0;
    const updatedAnswers = submission.answers.map((originalAnswer: any) => {
      const teacherGradedAnswer = gradedAnswersFromTeacher.find(
        (ans: any) => ans.questionId === originalAnswer.questionId.toString()
      );

      if (teacherGradedAnswer) {
        const questionDetails = originalTest.questions.find(
          (q: any) => q._id.toString() === originalAnswer.questionId.toString()
        );
        const maxPoints = questionDetails ? questionDetails.points || 0 : 0;

        const finalScore = Math.max(
          0,
          Math.min(teacherGradedAnswer.scoreAwarded ?? 0, maxPoints)
        );
        finalTotalScore += finalScore;

        return {
          ...originalAnswer,
          scoreAwarded: finalScore, // Punteggio finale deciso dal docente
          isCorrect:
            teacherGradedAnswer.isCorrect ??
            (finalScore > 0 && finalScore === maxPoints), // Priorità alla valutazione del docente
          teacherFeedback:
            teacherGradedAnswer.teacherFeedback ||
            originalAnswer.aiFeedback ||
            "", // Priorità al feedback docente
          aiGradingStatus: "completed", // Considera il processo AI completo dopo la revisione
        };
      }
      // Se la risposta non è stata gradata dal docente, mantieni il punteggio esistente (da auto-correzione)
      finalTotalScore += originalAnswer.scoreAwarded || 0;
      return originalAnswer;
    });

    const updateOperation = {
      $set: {
        answers: updatedAnswers,
        totalScoreAwarded: finalTotalScore,
        status: "graded" as const, // Stato finale
        gradedAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const result = await submissionsCollection.findOneAndUpdate(
      { _id: submissionObjectId },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Finalizzazione della correzione fallita.");
    }

    return res.status(200).json({
      message: "Correzione del test finalizzata con successo.",
      submission: result, // Restituisce la submission aggiornata
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Errore del server durante la finalizzazione della correzione.",
      error: error.message,
    });
  }
};
