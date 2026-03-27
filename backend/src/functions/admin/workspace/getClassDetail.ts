import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Class } from "../../../models/schemas/class.schema";
import { User } from "../../../models/schemas/user.schema";
import { TeacherAssignment } from "../../../models/schemas/teacher-assignment.schema";

const getClassDetail = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const classId = request.pathParameters?.classId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!classId || !mongo.ObjectId.isValid(classId)) {
    throw createError.BadRequest("Invalid or missing classId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);
  const classObjectId = new mongo.ObjectId(classId);

  // 1. Get Class info
  const classData = await Class.findOne({
    _id: classObjectId,
    organizationId: orgObjectId
  });

  if (!classData) {
    // Prova senza organizationId per retrocompatibilità (solo se necessario, ma meglio essere rigidi per il futuro)
    // Se il cliente ha detto che non vede la struttura, forse è qui il problema.
    throw createError.NotFound("Class not found in this organization");
  }

  // 2. Get Students detail
  const students = await User.find({
    _id: { $in: classData.students || [] }
  });

  // 3. Get Assignments for this class
  const assignments = await TeacherAssignment.aggregate([
    { $match: { classId: classObjectId } },
    {
      $lookup: {
        from: "users",
        localField: "teacherId",
        foreignField: "_id",
        as: "teacher"
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$teacher" },
    { $unwind: "$subject" }
  ]);

  return {
    success: true,
    class: classData,
    students,
    assignments
  };
};

export const handler = lambdaRequest(getClassDetail);
