import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Subject } from "../../../models/schemas/subject.schema";
import { Class } from "../../../models/schemas/class.schema";
import { TeacherAssignment } from "../../../models/schemas/teacher-assignment.schema";

const getWorkspaceDidactics = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  // 1. Get Subjects with teacher info
  const subjects = await Subject.aggregate([
    { $match: { organizationId: orgObjectId } },
    {
      $lookup: {
        from: "users",
        localField: "teacherId",
        foreignField: "_id",
        as: "teacher"
      }
    },
    { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } }
  ]);

  // 2. Get Classes with student count
  const classes = await Class.aggregate([
    { $match: { organizationId: orgObjectId } },
    {
      $project: {
        name: 1,
        organizationId: 1,
        studentCount: { $size: { $ifNull: ["$students", []] } },
        createdAt: 1
      }
    }
  ]);

  // 3. Get Teacher Assignments (Detailed)
  const assignments = await TeacherAssignment.aggregate([
    { $match: { organizationId: orgObjectId } },
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
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "class"
      }
    },
    { $unwind: "$teacher" },
    { $unwind: "$subject" },
    { $unwind: "$class" }
  ]);

  return {
    success: true,
    subjects,
    classes,
    assignments
  };
};

export const handler = lambdaRequest(getWorkspaceDidactics);
