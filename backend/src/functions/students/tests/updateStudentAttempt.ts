import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { sanitizeAttemptQuestions } from "./_helpers";
import { Attempt } from "../../../models/schemas/attempt.schema";

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
  await connectDatabase();

  // Verify ownership and status
  const existing = await Attempt.findOne({
    _id: new mongo.ObjectId(attemptId),
    studentId: new mongo.ObjectId(studentId),
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

  const result = await Attempt.findOneAndUpdate(
    { _id: new mongo.ObjectId(attemptId), studentId: new mongo.ObjectId(studentId) },
    { $set: updateFields },
    { returnDocument: "after" },
  );

  return { attempt: result };
};

export const handler = lambdaRequest(updateStudentAttempt);
