import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";
import { User } from "../../../models/schemas/user.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { Assistant } from "../../../models/schemas/assistant.schema";

const createSubjectHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const orgId = request.pathParameters?.organizationId;
  if (!orgId) throw createError.BadRequest("Organization ID is required");

  const { name, teacherId, newTeacherData } = JSON.parse(request.body || "{}");
  if (!name) throw createError.BadRequest("Subject name is required");

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(orgId);

  let finalTeacherId: Types.ObjectId | null = null;

  if (newTeacherData) {
    const { firstName, lastName, email } = newTeacherData;
    if (!firstName || !lastName || !email) {
      throw createError.BadRequest("firstName, lastName and email are required for new teacher");
    }

    // 1. Create in Cognito
    const cognitoId = await createCognitoUser(email, firstName, lastName, "teacher");

    // 2. Create in MongoDB
    const userResult = await User.insertOne({
      cognitoId,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      role: "teacher",
      organizationIds: [orgObjectId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    finalTeacherId = userResult._id;
  } else if (teacherId) {
    finalTeacherId = new mongo.ObjectId(teacherId);
  }

  const subjectData: any = {
    name,
    organizationId: orgObjectId,
    teacherId: finalTeacherId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await Subject.insertOne(subjectData);
  const subjectIdResult = result._id;

  // Initialize Assistant for this subject
  await Assistant.insertOne({
    name: "Anna",
    tone: "friendly",
    voice: "neutral",
    teacherId: finalTeacherId!,
    subjectId: subjectIdResult,
    organizationId: orgObjectId,
    associatedFileIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    subjectId: subjectIdResult.toString(),
    message: "Materia creata con successo"
  };
};

export const handler = lambdaRequest(createSubjectHandler);
