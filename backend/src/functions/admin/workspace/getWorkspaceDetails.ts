import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getWorkspaceDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // 1. Get Organization basic info
  const organization = await db.collection("organizations").findOne({ _id: orgObjectId });
  if (!organization) {
    throw createError.NotFound("Organization not found");
  }

  // 2. Get Stats
  const staffCount = await db.collection("users").countDocuments({ 
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: { $in: ["teacher", "admin"] }
  });

  const studentsCount = await db.collection("users").countDocuments({ 
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: "student"
  });

  const classesCount = await db.collection("classes").countDocuments({ 
    organizationId: orgObjectId
  });

  const subjectsCount = await db.collection("subjects").countDocuments({ 
    organizationId: orgObjectId
  });

  return {
    success: true,
    organization: {
        ...organization,
        _id: organization._id.toString()
    },
    stats: {
      staffCount,
      studentsCount,
      classesCount,
      subjectsCount
    }
  };
};

export const handler = lambdaRequest(getWorkspaceDetails);
