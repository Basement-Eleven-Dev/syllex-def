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
  const { firstName, lastName, email, role, classId, subjectId } = JSON.parse(request.body || '{}');

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

  // 3. Optional Associations
  if (role === 'student' && classId && ObjectId.isValid(classId)) {
    await db.collection("classes").updateOne(
      { _id: new ObjectId(classId) },
      { $addToSet: { students: userResult.insertedId } }
    );
  }

  if (role === 'teacher' && subjectId && ObjectId.isValid(subjectId)) {
    await db.collection("subjects").updateOne(
      { _id: new ObjectId(subjectId) },
      { $set: { teacherId: userResult.insertedId } }
    );
  }

  return {
    success: true,
    user: {
      ...userResult,
      _id: userResult.insertedId.toString(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      role
    }
  };
};

export const handler = lambdaRequest(createUser);
