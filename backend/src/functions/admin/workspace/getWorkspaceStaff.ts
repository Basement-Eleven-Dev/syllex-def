import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getWorkspaceStaff = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // Use aggregation to find users and check if they have assignments
  const staff = await db.collection("users").aggregate([
    {
      $match: {
        $or: [
          { organizationId: orgObjectId },
          { organizationIds: orgObjectId }
        ],
        role: { $in: ["teacher", "admin"] }
      }
    },
    {
      $lookup: {
        from: "teacher_assignments",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$teacherId", "$$userId"] },
                  { $eq: ["$organizationId", orgObjectId] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: "assignments"
      }
    },
    {
      $addFields: {
        hasAssignments: { $gt: [{ $size: "$assignments" }, 0] }
      }
    },
    { $project: { assignments: 0 } },
    { $sort: { lastName: 1, firstName: 1 } }
  ]).toArray();

  return {
    success: true,
    staff
  };
};

export const handler = lambdaRequest(getWorkspaceStaff);
