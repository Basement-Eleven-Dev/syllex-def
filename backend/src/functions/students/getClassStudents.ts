import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { User } from "../../models/user";

const getClassStudents = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  const db = await getDefaultDatabase();
  const classesCollection = db.collection("classes");
  const usersCollection = db.collection<User>("users");

  // Find the class
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

  // Fetch students from users collection with role 'student'
  const students = await usersCollection
    .find({
      _id: { $in: studentIds },
      role: "student",
    })
    .toArray();

  return {
    students,
  };
};

export const handler = lambdaRequest(getClassStudents);
