import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Class } from "../../models/schemas/class.schema";
import { User } from "../../models/schemas/user.schema";

const getClassStudents = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;

  if (!classId) {
    throw createError.BadRequest("classId is required");
  }

  await connectDatabase();

  // Find the class
  const classData = await Class.findOne({
    _id: new mongo.ObjectId(classId),
  });

  if (!classData) {
    throw createError.NotFound("Class not found");
  }

  // Get student IDs from the class
  const studentIds: Types.ObjectId[] = (classData.students);

  // Fetch students from users collection with role 'student'
  const students = await User
    .find({
      _id: { $in: studentIds },
      role: "student",
    })

  return {
    students,
  };
};

export const handler = lambdaRequest(getClassStudents);
