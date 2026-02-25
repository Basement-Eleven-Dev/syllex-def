import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getWorkspaceStudents = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  const students = await db.collection("users").find({ 
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: "student"
  }).sort({ lastName: 1, firstName: 1 }).toArray();

  return {
    success: true,
    students
  };
};

export const handler = lambdaRequest(getWorkspaceStudents);
