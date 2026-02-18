import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Attempt } from "../../../models/attempt";
import { sanitizeAttemptQuestions } from "./_helpers";

const updateStudentAttempt = async (
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

  const body = JSON.parse(request.body || "{}");
  const db = await getDefaultDatabase();
  const attemptsCollection = db.collection<Attempt>("attempts");

  // Verify ownership and status
  const existing = await attemptsCollection.findOne({
    _id: new ObjectId(attemptId),
    studentId: new ObjectId(studentId),
  });

  if (!existing) {
    throw createError.NotFound("Attempt not found");
  }

  if (existing.status !== "in-progress") {
    throw createError.Forbidden("Cannot update a submitted attempt");
  }

  // Build update payload — only allow safe fields
  const updateFields: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (body.questions !== undefined) {
    updateFields.questions = sanitizeAttemptQuestions(body.questions);
  }

  if (typeof body.timeSpent === "number") {
    updateFields.timeSpent = body.timeSpent;
  }

  const result = await attemptsCollection.findOneAndUpdate(
    { _id: new ObjectId(attemptId), studentId: new ObjectId(studentId) },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  return { attempt: result };
};

export const handler = lambdaRequest(updateStudentAttempt);
