import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Attempt } from "../../../models/attempt";
import { sanitizeAttemptQuestions } from "./_helpers";

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

  const db = await getDefaultDatabase();
  const attemptsCollection = db.collection<Attempt>("attempts");

  // Prevent duplicate in-progress attempts for the same test
  const existing = await attemptsCollection.findOne({
    testId: new ObjectId(body.testId),
    studentId: new ObjectId(studentId),
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
        return {
          ...q,
          points: incomingPointsMap[qId] ?? (q as any).points ?? 0,
        };
      });
      const patchedMaxScore = patchedQuestions.reduce(
        (sum, q) => sum + ((q as any).points ?? 0),
        0,
      );

      await attemptsCollection.updateOne(
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
  const attempt: Omit<Attempt, "_id"> = {
    testId: new ObjectId(body.testId),
    subjectId: body.subjectId ? new ObjectId(body.subjectId) : undefined!,
    teacherId: body.teacherId ? new ObjectId(body.teacherId) : undefined!,
    studentId: new ObjectId(studentId),
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

  const result = await attemptsCollection.insertOne(attempt as any);

  return {
    attempt: {
      _id: result.insertedId,
      ...attempt,
    },
  };
};

export const handler = lambdaRequest(createStudentAttempt);
