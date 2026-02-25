import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getWorkspaceDidactics = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // 1. Get Subjects with teacher info
  const subjects = await db.collection("subjects").aggregate([
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
  ]).toArray();

  // 2. Get Classes with student count
  const classes = await db.collection("classes").aggregate([
    { $match: { organizationId: orgObjectId } },
    {
        $project: {
            name: 1,
            organizationId: 1,
            studentCount: { $size: { $ifNull: ["$students", []] } },
            createdAt: 1
        }
    }
  ]).toArray();

  // 3. Get Teacher Assignments (Detailed)
  const assignments = await db.collection("teacher_assignments").aggregate([
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
  ]).toArray();

  return {
    success: true,
    subjects,
    classes,
    assignments
  };
};

export const handler = lambdaRequest(getWorkspaceDidactics);
