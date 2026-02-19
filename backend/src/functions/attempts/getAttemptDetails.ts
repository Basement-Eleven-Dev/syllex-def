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
    // 1. Recupero configurazione punti dal Test
    const testQuestionConfig = attempt.testInfo.questions?.find(
      (tq: any) =>
        (tq.questionId?.toString() || tq.id?.toString()) ===
        q.question._id.toString(),
    );
    const questionMaxScore = testQuestionConfig?.points ?? 1;

    let resultStatus: "correct" | "wrong" | "dubious" | "empty" = "empty";
    let currentScore = 0;

    const isOpenQuestion =
      q.question.type === "risposta aperta" || q.question.type === "aperta";
    const isEmpty = !q.answer || q.answer.toString().trim() === "";

    // 2. LOGICA DEDUTTIVA
    if (isEmpty) {
      resultStatus = "empty";
      currentScore = 0;
      questionsStats.empty++;
    } else if (isOpenQuestion) {
      // Per le APERTE: deduciamo lo stato dal campo status, ma il punteggio è quello del DB
      resultStatus =
        q.status === "correct"
          ? "correct"
          : q.status === "wrong"
            ? "wrong"
            : "dubious";

      currentScore = q.score ?? 0; // Qui ci fidiamo del DB (o dell'AI)

      if (resultStatus === "dubious") questionsStats.dubious++;
      else if (resultStatus === "correct") questionsStats.correct++;
      else questionsStats.wrong++;
    } else {
      // Per le CHIUSE: deduciamo tutto dal confronto answer <-> options
      const correctOption = q.question.options?.find(
        (opt: any) => opt.isCorrect,
      );
      const isCorrect =
        q.answer?.toString().trim() === correctOption?.label?.toString().trim();

      if (isCorrect) {
        resultStatus = "correct";
        currentScore = questionMaxScore; // Forza il punteggio massimo
        questionsStats.correct++;
      } else {
        resultStatus = "wrong";
        currentScore = 0;
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
        score: currentScore,
        maxScore: questionMaxScore,
        feedback: q.teacherComment || "",
      },
    };
  });

  // 3. Calcolo Punteggio Totale (Somma dei punteggi dedotti)
  const totalCalculatedScore = mappedQuestions.reduce(
    (acc: number, curr: any) => acc + (Number(curr.answer.score) || 0),
    0,
  );

  return {
    testTitle: attempt.testInfo.name,
    studentName: `${attempt.studentInfo.firstName} ${attempt.studentInfo.lastName}`,
    status: attempt.status,
    submissionDate: attempt.deliveredAt || attempt.updatedAt,
    score: totalCalculatedScore,
    maxScore: attempt.testInfo.maxScore || attempt.maxScore,
    timeSpent: attempt.timeSpent,
    maxTime: attempt.testInfo.timeLimit || 0,
    totalQuestions: attempt.questions.length,
    questionsStats: questionsStats,
    questions: mappedQuestions,
  };
};

export const handler = lambdaRequest(getAttemptDetails);
