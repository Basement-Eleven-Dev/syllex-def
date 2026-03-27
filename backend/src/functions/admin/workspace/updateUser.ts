import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { updateCognitoUser } from "../../../_helpers/cognito/userManagement";
import { User } from "../../../models/schemas/user.schema";
import { Class } from "../../../models/schemas/class.schema";

const updateUser = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const userId = request.pathParameters?.userId;
  const { firstName, lastName, role, classId, subjectId } = JSON.parse(request.body || '{}');

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!userId || !mongo.ObjectId.isValid(userId)) {
    throw createError.BadRequest("Invalid or missing userId");
  }

  if (!firstName || !lastName || !role) {
    throw createError.BadRequest("Missing required fields: firstName, lastName, role");
  }

  await connectDatabase();
  const userObjectId = new mongo.ObjectId(userId);
  const orgObjectId = new mongo.ObjectId(organizationId);

  // 1. Get current user to check email
  const currentUser = await User.findOne({ _id: userObjectId });
  if (!currentUser) {
    throw createError.NotFound("User not found");
  }

  // 2. Update in Cognito (syncing names)
  await updateCognitoUser(currentUser.email, firstName, lastName);

  // 3. Update in MongoDB
  await User.updateOne(
    { _id: userObjectId },
    {
      $set: {
        firstName,
        lastName,
        role,
        updatedAt: new Date()
      }
    }
  );

  // 4. Update Associations (if student, update class)
  if (role === 'student') {
    // Remove from all classes and add to new one
    await Class.updateMany(
      { organizationId: orgObjectId },
      { $pull: { students: userObjectId } as any }
    );

    if (classId && mongo.ObjectId.isValid(classId)) {
      await Class.updateOne(
        { _id: new mongo.ObjectId(classId) },
        { $addToSet: { students: userObjectId } as any }
      );
    }
  }

  // Note: For teachers, we don't automatically update assignments here yet 
  // to avoid complex side effects, but it could be expanded if needed.

  return {
    success: true,
    user: {
      _id: userId,
      firstName,
      lastName,
      email: currentUser.email,
      role
    }
  };
};

export const handler = lambdaRequest(updateUser);
