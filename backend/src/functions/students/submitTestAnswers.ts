import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { performAiGrading } from "../../background/processAIGrading";
import { triggerBackgroundTask } from "../../_helpers/_utils/sqs.utils";

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
  const studentMongoId: ObjectId = user._id;

  const { submissionId, answers: answersFromClient } = JSON.parse(
    req.body || "{}"
  );

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return res
      .status(400)
      .json({ message: "ID Svolgimento non valido o mancante." });
  }
  const submissionObjectId = new ObjectId(submissionId);

  if (!answersFromClient || !Array.isArray(answersFromClient)) {
    return res.status(400).json({ message: "Formato risposte non valido." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const submissionsCollection = db.collection("testsubmissions");
    const testsCollection = db.collection("tests");

    const submission = await submissionsCollection.findOne({
      _id: submissionObjectId,
    });
    if (
      !submission ||
      submission.studentId.toString() !== studentMongoId.toString() ||
      submission.status !== "in-progress"
    ) {
      return res
        .status(400)
        .json({ message: "Svolgimento non valido, già inviato, o non tuo." });
    }

    const originalTest = await testsCollection.findOne({
      _id: submission.testId,
    });
    if (!originalTest || !originalTest.questions) {
      return res
        .status(404)
        .json({ message: "Test originale o domande non trovati." });
    }

    let currentTotalScore = 0;
    let hasOpenEndedQuestions = false;

    const processedAnswers = originalTest.questions.map(
      (questionInTest: any) => {
        const studentAnswerObject = answersFromClient.find(
          (sa: any) => sa.questionId === questionInTest._id.toString()
        );
        const studentResponse = studentAnswerObject
          ? studentAnswerObject.studentResponse
          : undefined;
        let isCorrect: boolean | null = null;
        let scoreAwarded = 0;
        const pointsForQuestion = questionInTest.points || 0;
        const questionType = questionInTest.questionType;
        let currentAiGradingStatus: string | null = null;

        if (
          studentResponse !== undefined &&
          studentResponse !== null &&
          String(studentResponse).trim() !== ""
        ) {
          if (questionType === "multiple-choice") {
            isCorrect =
              String(studentResponse).trim().toLowerCase() ===
              String(questionInTest.correctAnswer).trim().toLowerCase();
            if (isCorrect) scoreAwarded = pointsForQuestion;
          } else if (questionType === "true-false") {
            const normalizeToBoolean = (value: any): boolean => {
              if (typeof value === "boolean") return value;
              if (typeof value === "string") {
                const lowerCaseValue = value.trim().toLowerCase();
                return lowerCaseValue === "vero" || lowerCaseValue === "true";
              }
              return !!value; // Fallback per altri tipi
            };

            const studentResponseAsBool = normalizeToBoolean(studentResponse);
            const correctAnswerAsBool = normalizeToBoolean(
              questionInTest.correctAnswer
            );

            isCorrect = studentResponseAsBool === correctAnswerAsBool;
            if (isCorrect) scoreAwarded = pointsForQuestion;
          } else if (questionType.startsWith("open-ended")) {
            hasOpenEndedQuestions = true;
            isCorrect = null;
            currentAiGradingStatus = "pending";
          }
        } else {
          isCorrect = false;
        }

        currentTotalScore += scoreAwarded;
        return {
          questionId: new ObjectId(questionInTest._id),
          studentResponse: studentResponse,
          isCorrect: isCorrect,
          scoreAwarded: scoreAwarded,
          aiGradingStatus: currentAiGradingStatus,
          originalQuestionType: questionType,
        };
      }
    );

    const submissionUpdateData: any = {
      answers: processedAnswers,
      submittedAt: new Date(),
      totalScoreAwarded: currentTotalScore,
      updatedAt: new Date(),
      status: hasOpenEndedQuestions ? "submitted" : "graded",
    };
    if (!hasOpenEndedQuestions) {
      submissionUpdateData.gradedAt = new Date();
    }

    await submissionsCollection.updateOne(
      { _id: submissionObjectId, studentId: studentMongoId },
      { $set: submissionUpdateData }
    );

    if (submissionUpdateData.status === "submitted" && hasOpenEndedQuestions) {
      const submissionId = submissionObjectId.toString();

      await triggerBackgroundTask(
        process.env.AI_GRADING_QUEUE_URL, // L'URL per l'ambiente AWS
        submissionId, // Il messaggio da inviare
        () => performAiGrading(submissionId)
      );
    }

    return res.status(200).json({
      message: `Test "${originalTest.title}" inviato!`,
      submissionId: submissionObjectId.toString(),
      scoreAwarded:
        submissionUpdateData.status === "graded"
          ? currentTotalScore
          : undefined,
      testTitle: originalTest.title,
      submissionStatus: submissionUpdateData.status,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Errore del server durante l'invio delle risposte.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
