import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Attempt } from "../../../models/attempt";
import { precorrectTest } from "../../../_helpers/student-test/precorrectTest";

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

  const db = await getDefaultDatabase();
  const attemptsCollection = db.collection<Attempt>("attempts");

  const attempt = await attemptsCollection.findOne({
    _id: new ObjectId(attemptId),
    studentId: new ObjectId(studentId),
  });

  if (!attempt) {
    throw createError.NotFound("Attempt not found");
  }

  if (attempt.status !== "in-progress") {
    throw createError.Forbidden("Attempt already submitted");
  }

  // Attempt auto-correction on closed-answer questions
  const questionsForCorrection = attempt.questions.map((q) => ({
    answer: q.answer,
    correct: q.question?.options?.find((o) => o.isCorrect)?.label ?? null,
    type: q.question?.type,
  }));

  const correctable = questionsForCorrection.every(
    (q) => q.type !== "risposta aperta",
  );

  const now = new Date();
  const startedAt = new Date(attempt.startedAt).getTime();
  const timeSpent = Math.floor((now.getTime() - startedAt) / 1000);

  const updateFields: Record<string, any> = {
    status: "delivered",
    deliveredAt: now,
    timeSpent,
    updatedAt: now,
  };

  // If all questions are closed-type, try auto-correction
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

  const result = await attemptsCollection.findOneAndUpdate(
    { _id: new ObjectId(attemptId) },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  return {
    success: true,
    attempt: result,
  };
};

export const handler = lambdaRequest(submitStudentAttempt);
