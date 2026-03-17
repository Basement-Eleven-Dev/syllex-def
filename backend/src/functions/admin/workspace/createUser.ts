import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";
import { User } from "../../../models/schemas/user.schema";
import { Class } from "../../../models/schemas/class.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { Assistant } from "../../../models/schemas/assistant.schema";
import { TeacherAssignment } from "../../../models/schemas/teacher-assignment.schema";

// Questo è l'entry point per la creazione degli utenti lato admin (Workspace)
const createUser = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const { firstName, lastName, email, role, classId, subjectId, newSubjectName } = JSON.parse(request.body || '{}');

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!firstName || !lastName || !email || !role) {
    throw createError.BadRequest("Missing required fields: firstName, lastName, email, role");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  // 1. Create in Cognito (includes email)
  const cognitoId = await createCognitoUser(email, firstName, lastName, role);

  // 2. Create in MongoDB
  const userResult = await User.insertOne({
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
  if (role === 'student' && classId && mongo.ObjectId.isValid(classId)) {
    await Class.updateOne(
      { _id: new mongo.ObjectId(classId) },
      { $addToSet: { students: userResult._id } }
    );
  }

  if (role === 'teacher') {
    let finalSubjectId: Types.ObjectId | null = null;

    if (newSubjectName) {
      // Create a new subject if requested
      const subResult = await Subject.insertOne({
        name: newSubjectName,
        teacherId: userResult._id,
        organizationId: orgObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      finalSubjectId = subResult._id;

      // Initialize Assistant for this new subject
      await Assistant.insertOne({
        name: "Anna",
        tone: "friendly",
        voice: "neutral",
        teacherId: userResult._id,
        subjectId: finalSubjectId,
        organizationId: orgObjectId,
        associatedFileIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (subjectId && mongo.ObjectId.isValid(subjectId)) {
      finalSubjectId = new mongo.ObjectId(subjectId);
      await Subject.updateOne(
        { _id: finalSubjectId },
        { $set: { teacherId: userResult._id } }
      );
    }

    // 4. Integrated Class Assignment for Teachers
    if (finalSubjectId && classId && mongo.ObjectId.isValid(classId)) {
      await TeacherAssignment.insertOne({
        teacherId: userResult._id,
        subjectId: finalSubjectId,
        classId: new mongo.ObjectId(classId),
        organizationId: orgObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return {
    success: true,
    user: {
      ...userResult,
      _id: userResult._id.toString(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      role
    }
  };
};

export const handler = lambdaRequest(createUser);
