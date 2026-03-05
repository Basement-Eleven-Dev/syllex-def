import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getClassAttempts = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;
  const subjectId = context.subjectId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  const db = await getDefaultDatabase();
  const classesCollection = db.collection("classes");
  const attemptsCollection = db.collection("attempts");

  // Find the class to get student IDs
  const classData = await classesCollection.findOne({
    _id: new ObjectId(classId),
  });

  if (!classData) {
    throw createError.NotFound("Class not found");
  }

  // Get student IDs from the class
  const studentIds = (classData.students || []).map((id: string | ObjectId) =>
    typeof id === "string" ? new ObjectId(id) : id,
  );

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
  const attempts = await attemptsCollection.find(filter).toArray();

  return {
    attempts,
  };
};

export const handler = lambdaRequest(getClassAttempts);
