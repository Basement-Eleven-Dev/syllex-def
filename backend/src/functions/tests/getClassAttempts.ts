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

  // Find all attempts for students in this class
  const attempts = await attemptsCollection
    .find({
      studentId: { $in: studentIds },
    })
    .toArray();

  return {
    attempts,
  };
};

export const handler = lambdaRequest(getClassAttempts);
