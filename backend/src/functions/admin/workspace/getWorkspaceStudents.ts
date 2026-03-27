import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { User } from "../../../models/schemas/user.schema";

const getWorkspaceStudents = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  const students = await User.find({
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: "student"
  }).sort({ lastName: 1, firstName: 1 });

  return {
    success: true,
    students
  };
};

export const handler = lambdaRequest(getWorkspaceStudents);
