import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";

const createUser = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const { firstName, lastName, email, role } = JSON.parse(request.body || '{}');

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!firstName || !lastName || !email || !role) {
    throw createError.BadRequest("Missing required fields: firstName, lastName, email, role");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // 1. Create in Cognito (includes email)
  const cognitoId = await createCognitoUser(email, firstName, lastName, role);

  // 2. Create in MongoDB
  const userResult = await db.collection("users").insertOne({
    cognitoId,
    email: email.toLowerCase().trim(),
    firstName,
    lastName,
    role,
    organizationIds: [orgObjectId],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    user: {
      ...userResult,
      _id: userResult.insertedId.toString()
    }
  };
};

export const handler = lambdaRequest(createUser);
