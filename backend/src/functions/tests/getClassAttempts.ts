import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Class } from "../../models/schemas/class.schema";
import { Attempt } from "../../models/schemas/attempt.schema";

const getClassAttempts = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;
  const subjectId = context.subjectId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  await connectDatabase();

  // Find the class to get student IDs
  const classData = await Class.findOne({
    _id: new mongo.ObjectId(classId),
  });

  if (!classData) {
    throw createError.NotFound("Class not found");
  }

  // Get student IDs from the class
  const studentIds = (classData.students || [])
  // Build filter: students in this class, optionally filtered by subject
  // Exclude self-evaluation attempts (those are student-initiated, not teacher-assigned)
  const filter: any = {
    studentId: { $in: studentIds },
    source: { $ne: "self-evaluation" },
  };

  if (subjectId) {
    filter.subjectId = subjectId;
  }

  // Find all attempts for students in this class (filtered by subject)
  const attempts = await Attempt.find(filter);

  return {
    attempts,
  };
};

export const handler = lambdaRequest(getClassAttempts);
