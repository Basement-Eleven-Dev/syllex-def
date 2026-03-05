import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getClassDetail = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const classId = request.pathParameters?.classId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!classId || !ObjectId.isValid(classId)) {
    throw createError.BadRequest("Invalid or missing classId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);
  const classObjectId = new ObjectId(classId);

  // 1. Get Class info
  const classData = await db.collection("classes").findOne({ 
    _id: classObjectId,
    organizationId: orgObjectId 
  });

  if (!classData) {
    // Prova senza organizationId per retrocompatibilità (solo se necessario, ma meglio essere rigidi per il futuro)
    // Se il cliente ha detto che non vede la struttura, forse è qui il problema.
    throw createError.NotFound("Class not found in this organization");
  }

  // 2. Get Students detail
  const students = await db.collection("users").find({
    _id: { $in: classData.students || [] }
  }).toArray();

  // 3. Get Assignments for this class
  const assignments = await db.collection("teacher_assignments").aggregate([
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
  ]).toArray();

  return {
    success: true,
    class: classData,
    students,
    assignments
  };
};

export const handler = lambdaRequest(getClassDetail);
