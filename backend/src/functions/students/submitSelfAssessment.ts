import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import { getAnthropicResponse } from "../../_helpers/_ai-aws/assistant.service";
import { extractJsonFromResponse } from "../../_helpers/_ai-aws/ai-utils";
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
  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { submissionId, answers } = JSON.parse(req.body || "{}");

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return res
      .status(400)
      .json({ message: "ID dello svolgimento non valido o mancante." });
  }
  if (!Array.isArray(answers)) {
    return res
      .status(400)
      .json({ message: "È necessario fornire un array di risposte." });
  }

  const submissionObjectId = new ObjectId(submissionId);
  const studentId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const submissionsCollection = db.collection("selfAssessmentSubmissions");
    const testsCollection = db.collection("selfAssessmentTests");

    const submission = await submissionsCollection.findOne({
      _id: submissionObjectId,
      studentId: studentId,
      status: "in-progress",
    });

    if (!submission) {
      return res.status(404).json({
        message: "Svolgimento non trovato, già completato o non autorizzato.",
      });
    }

    const originalTest = await testsCollection.findOne({
      _id: submission.testId,
    });
    if (!originalTest) {
      return res
        .status(404)
        .json({ message: "Test di autovalutazione associato non trovato." });
    }

    let totalScoreAwarded = 0;

    const gradedAnswersPromises = answers.map(async (studentAnswer: any) => {
      const question = originalTest.questions.find((q: any) =>
        q._id.equals(studentAnswer.questionId)
      );
      if (!question) {
        return { ...studentAnswer, isCorrect: null, scoreAwarded: 0 };
      }

      let isCorrect = false;
      let scoreAwarded = 0;
      let aiFeedback = "";

      if (question.questionType === "open-ended-short") {
        const systemPrompt = `You are a helpful and fair AI teaching assistant. 
      Your goal is to evaluate a student's open-ended answer and provide constructive feedback that helps them learn.
      
      **CRITICAL RULES:**
      1.  **LANGUAGE:** Your entire JSON output, including the feedback, MUST be written in **${question.language || "italian"
          }**.
      2.  **TONE:** The feedback should be encouraging and clear. If the answer is wrong, explain *why* it's wrong and gently guide the student towards the correct concepts.
      3.  **EVALUATION BASIS:** Your evaluation must be based *strictly* on comparing the student's answer to the provided "Model Answer". Do not use external knowledge.
      4.  **JSON FORMAT ONLY:** Your response must be ONLY a valid JSON object with two exact keys: 
         - "isCorrect" (boolean) 
         - "feedback" (a constructive explanation in ${question.language || "italian"
          }).`;

        const userPrompt = `Please evaluate the following student's answer.
      
      **Question:**
      "${question.questionText}"
      
      **Model Answer (for your reference):**
      "${question.correctAnswer}"
      
      **Student's Answer to Evaluate:**
      "${studentAnswer.studentResponse}"`;

        try {
          const aiResponseString = await getAnthropicResponse(
            systemPrompt,
            userPrompt,
            true,
            'self-assessment'
          );

          const aiResult = extractJsonFromResponse(aiResponseString);

          if (aiResult) {
            isCorrect = aiResult.isCorrect === true;
            aiFeedback = aiResult.feedback || "";
            if (isCorrect) {
              scoreAwarded = question.points || 0;
            }
          } else {
            throw new Error(
              "La risposta dell'AI non conteneva un JSON valido."
            );
          }
        } catch (e: any) {
          isCorrect = false;
          scoreAwarded = 0;
          aiFeedback = "Errore durante la valutazione automatica.";
        }
      } else if (question.questionType === "multiple-choice") {
        // confronto pulito
        const correctAnswerClean = (question.correctAnswer || "")
          .toString()
          .trim()
          .toLowerCase();
        const studentResponseClean = (studentAnswer.studentResponse || "")
          .toString()
          .trim()
          .toLowerCase();

        isCorrect = correctAnswerClean === studentResponseClean;
        if (isCorrect) scoreAwarded = question.points || 1;
      } else if (question.questionType === "true-false") {
        let studentResponseAsString = "";

        if (typeof studentAnswer.studentResponse === "boolean") {
          studentResponseAsString = studentAnswer.studentResponse
            ? "Vero"
            : "Falso";
        } else if (typeof studentAnswer.studentResponse === "string") {
          const response = studentAnswer.studentResponse.toLowerCase();
          if (["true", "vero"].includes(response)) {
            studentResponseAsString = "Vero";
          } else if (["false", "falso"].includes(response)) {
            studentResponseAsString = "Falso";
          } else {
            studentResponseAsString = studentAnswer.studentResponse; // fallback
          }
        }

        isCorrect =
          studentResponseAsString.toLowerCase() ===
          (question.correctAnswer || "").toString().toLowerCase();
        if (isCorrect) scoreAwarded = question.points || 1;
      }

      totalScoreAwarded += scoreAwarded;

      return {
        ...studentAnswer,
        questionId: new ObjectId(studentAnswer.questionId),
        isCorrect: isCorrect,
        scoreAwarded: scoreAwarded,
        aiFeedback: aiFeedback,
      };
    });

    const gradedAnswers = await Promise.all(gradedAnswersPromises);

    await submissionsCollection.updateOne(
      { _id: submissionObjectId },
      {
        $set: {
          answers: gradedAnswers,
          totalScoreAwarded: totalScoreAwarded,
          status: "graded",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      message: "Test di autovalutazione completato e corretto!",
      submissionId: submissionObjectId.toString(),
      scoreAwarded: totalScoreAwarded,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Errore del server durante la sottomissione del test.",
    });
  }
};
