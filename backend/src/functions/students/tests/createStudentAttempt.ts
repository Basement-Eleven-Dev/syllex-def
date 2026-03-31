import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { sanitizeAttemptQuestions } from "./_helpers";
import { Test } from "../../../models/schemas/test.schema";
import { Attempt } from "../../../models/schemas/attempt.schema";

const createStudentAttempt = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    throw createError.Unauthorized("User not authenticated");
  }

  const body = JSON.parse(request.body || "{}");

  if (!body.testId) {
    throw createError.BadRequest("testId is required");
  }

  const db = await connectDatabase();

  // Validate password if the test is password-protected
  const test = await Test.findOne({
    _id: new mongo.ObjectId(body.testId),
  });
  if (!test) {
    throw createError.NotFound("Test non trovato");
  }
  if (test.password) {
    if (!body.password || body.password !== test.password) {
      throw createError.Forbidden("Password del test non corretta");
    }
  }

  // Prevent duplicate in-progress attempts for the same test
  const existing = await Attempt.findOne({
    testId: new mongo.ObjectId(body.testId),
    studentId: new mongo.ObjectId(studentId),
    status: "in-progress",
  });

  if (existing) {
    // Build a map of questionId → points from the incoming body so we can
    // patch legacy attempts that were created before points were denormalized.
    const incomingPointsMap: Record<string, number> = {};
    if (Array.isArray(body.questions)) {
      for (const bq of body.questions) {
        const qId =
          bq.question?._id?.toString?.() ??
          bq.question?._id?.$oid ??
          bq.question?._id;
        if (qId) incomingPointsMap[qId] = bq.points ?? 0;
      }
    }

    const needsPointsPatch = existing.questions.some(
      (q) => (q as any).points == null || (q as any).points === 0,
    );

    if (needsPointsPatch && Object.keys(incomingPointsMap).length > 0) {
      const patchedQuestions = existing.questions.map((q) => {
        const qId = (q.question as any)._id?.toString?.();
        return sanitizeAttemptQuestions([
          {
            question: q.question,
            answer: q.answer,
            points: incomingPointsMap[qId] ?? (q as any).points ?? 0,
          },
        ])[0];
      });
      const patchedMaxScore = patchedQuestions.reduce(
        (sum, q) => sum + ((q as any).points ?? 0),
        0,
      );

      await Attempt.updateOne(
        { _id: existing._id },
        {
          $set: {
            questions: patchedQuestions,
            maxScore: patchedMaxScore,
            updatedAt: new Date(),
          },
        },
      );

      return {
        attempt: {
          ...existing,
          questions: patchedQuestions,
          maxScore: patchedMaxScore,
        },
      };
    }

    return { attempt: existing };
  }

  const now = new Date();
  const attempt = {
    testId: new mongo.ObjectId(body.testId),
    subjectId: body.subjectId ? new mongo.ObjectId(body.subjectId) : undefined!,
    teacherId: body.teacherId ? new mongo.ObjectId(body.teacherId) : undefined!,
    studentId: new mongo.ObjectId(studentId),
    status: "in-progress",
    startedAt: body.startedAt ? new Date(body.startedAt) : now,
    timeSpent: 0,
    questions: Array.isArray(body.questions)
      ? sanitizeAttemptQuestions(body.questions)
      : [],
    score: null,
    maxScore: body.questions
      .map((q: any) => q.points || 0)
      .reduce((a: number, b: number) => a + b, 0),
    fitTestScore: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await Attempt.insertOne(attempt as any);

  return {
    attempt: result,
  };
};

export const handler = lambdaRequest(createStudentAttempt);
