import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { precorrectTest } from "../../../_helpers/student-test/precorrectTest";
import { correctStudentQuestion } from "../../../_helpers/AI/correctStudentQuestion";
import { Attempt } from "../../../models/schemas/attempt.schema";

const submitStudentAttempt = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const attemptId = request.pathParameters?.attemptId;
  const studentId = context.user?._id;

  if (!attemptId) {
    throw createError.BadRequest("attemptId is required");
  }

  if (!studentId) {
    throw createError.Unauthorized("User not authenticated");
  }

  await connectDatabase();

  const attempt = await Attempt.findOne({
    _id: new mongo.ObjectId(attemptId),
    studentId: new mongo.ObjectId(studentId),
  });

  if (!attempt) {
    throw createError.NotFound("Attempt not found");
  }

  if (attempt.status !== "in-progress") {
    throw createError.Forbidden("Attempt already submitted");
  }

  const now = new Date();
  const startedAt = attempt.startedAt!.getTime();
  const timeSpent = Math.floor((now.getTime() - startedAt) / 1000);

  // ── Self-evaluation: correzione automatica completa (chiuse + AI per le aperte) ──
  if ((attempt as any).source === "self-evaluation") {
    const corrections = await Promise.all(
      attempt.questions.map(async (q, i) => {
        const type = q.question?.type;
        const answer = q.answer as string;
        const maxPoints = (q as any).points ?? 1;
        let score = 0;
        let teacherComment = "";

        if (type === "scelta multipla") {
          const correct = q.question?.options?.find((o) => o.isCorrect)?.label;
          score = answer === correct ? maxPoints : 0;
        } else if (type === "vero falso") {
          const correctBool = (q.question as any)?.correctAnswer;
          const answerBool = answer === "Vero";
          score = answerBool === correctBool ? maxPoints : 0;
        } else if (type === "risposta aperta") {
          const result = await correctStudentQuestion(
            answer ?? "",
            maxPoints,
            q.question?.explanation ?? "",
          );
          score = result.score;
          teacherComment = result.explanation;
        }

        return {
          index: i,
          score,
          teacherComment,
          status: score > 0 ? "correct" : "wrong",
        };
      }),
    );

    const $set: Record<string, any> = {
      status: "reviewed",
      deliveredAt: now,
      reviewedAt: now,
      timeSpent,
      updatedAt: now,
    };

    let totalScore = 0;
    for (const { index, score, teacherComment, status } of corrections) {
      $set[`questions.${index}.score`] = score;
      $set[`questions.${index}.teacherComment`] = teacherComment;
      $set[`questions.${index}.status`] = status;
      totalScore += score;
    }
    $set.score = totalScore;
    $set.maxScore = attempt.questions.reduce(
      (s, q) => s + ((q as any).points ?? 1),
      0,
    );

    const result = await Attempt.findOneAndUpdate(
      { _id: new mongo.ObjectId(attemptId) },
      { $set },
      { returnDocument: "after" },
    );
    return { success: true, attempt: result };
  }

  // ── Flusso normale: correzione chiuse se tutte determinabili ──
  const questionsForCorrection = attempt.questions.map((q) => ({
    answer: q.answer,
    correct: q.question?.options?.find((o) => o.isCorrect)?.label ?? null,
    type: q.question?.type,
  }));

  const correctable = questionsForCorrection.every(
    (q) => q.type !== "risposta aperta",
  );

  const updateFields: Record<string, any> = {
    status: "delivered",
    deliveredAt: now,
    timeSpent,
    updatedAt: now,
  };

  if (correctable) {
    const precorrection = precorrectTest({
      questions: questionsForCorrection.map((q) => ({
        answer: q.answer,
        correct: q.correct,
      })),
      fitScore: 1,
    });

    if (precorrection) {
      updateFields.score = precorrection.score;
      updateFields.fitTestScore = precorrection.fitTestScore;
      updateFields.status = precorrection.status;
      updateFields.maxScore = questionsForCorrection.length;
    }
  }

  const result = await Attempt.findOneAndUpdate(
    { _id: new mongo.ObjectId(attemptId) },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  return {
    success: true,
    attempt: result,
  };
};

export const handler = lambdaRequest(submitStudentAttempt);
