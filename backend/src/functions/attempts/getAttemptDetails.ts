import { APIGatewayProxyEvent } from "aws-lambda";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createError from "http-errors";

const getAttemptDetails = async (request: APIGatewayProxyEvent) => {
  const attemptId = request.pathParameters?.attemptId;
  if (!attemptId) throw createError.BadRequest("ID tentativo mancante");

  const db = await getDefaultDatabase();

  const result = await db
    .collection("attempts")
    .aggregate([
      { $match: { _id: new ObjectId(attemptId) } },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo",
        },
      },
      { $unwind: "$testInfo" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
    ])
    .toArray();

  const attempt = result[0];
  if (!attempt) throw createError.NotFound("Tentativo non trovato");

  const questionsStats = { correct: 0, wrong: 0, empty: 0, dubious: 0 };

  const mappedQuestions = attempt.questions.map((q: any) => {
    let resultStatus: "correct" | "wrong" | "dubious" | "empty" = "empty";

    const isOpenQuestion = q.question.type === "risposta aperta";
    const isEmpty = !q.answer || q.answer.trim() === "";

    if (isEmpty) {
      resultStatus = "empty";
      questionsStats.empty++;
    } else if (isOpenQuestion) {
      resultStatus =
        q.status === "correct"
          ? "correct"
          : q.status === "wrong"
            ? "wrong"
            : "dubious";

      if (resultStatus === "dubious") questionsStats.dubious++;
      else if (resultStatus === "correct") questionsStats.correct++;
      else questionsStats.wrong++;
    } else {
      const correctOption = q.question.options?.find(
        (opt: any) => opt.isCorrect,
      );
      const isCorrect = q.answer === correctOption?.label;

      if (isCorrect) {
        resultStatus = "correct";
        questionsStats.correct++;
      } else {
        resultStatus = "wrong";
        questionsStats.wrong++;
      }
    }

    return {
      question: q.question,
      answer: {
        result: resultStatus,
        answer: q.answer,
        isCorrect: resultStatus === "correct",
        isEmpty: resultStatus === "empty",
        score: q.score || 0,
        maxScore: 1,
        feedback: q.teacherComment || "",
      },
    };
    // --------------------------------------
  });

  return {
    testTitle: attempt.testInfo.name,
    studentName: `${attempt.studentInfo.firstName} ${attempt.studentInfo.lastName}`,
    status: attempt.status,
    submissionDate: attempt.deliveredAt || attempt.updatedAt,
    score: attempt.score,
    maxScore: attempt.maxScore,
    timeSpent: attempt.timeSpent,
    maxTime: attempt.testInfo.maxTime || 0,
    totalQuestions: attempt.questions.length,
    questionsStats: questionsStats,
    questions: mappedQuestions,
  };
};

export const handler = lambdaRequest(getAttemptDetails);
