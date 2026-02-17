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
    maxScore: body.questions?.length ?? null,
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
