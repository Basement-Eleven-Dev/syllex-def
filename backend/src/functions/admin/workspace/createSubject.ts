import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";

const createSubjectHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const orgId = request.pathParameters?.organizationId;
  if (!orgId) throw createError.BadRequest("Organization ID is required");

  const { name, teacherId, newTeacherData } = JSON.parse(request.body || "{}");
  if (!name) throw createError.BadRequest("Subject name is required");

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(orgId);
  
  let finalTeacherId: ObjectId | null = null;

  if (newTeacherData) {
    const { firstName, lastName, email } = newTeacherData;
    if (!firstName || !lastName || !email) {
      throw createError.BadRequest("firstName, lastName and email are required for new teacher");
    }

    // 1. Create in Cognito
    const cognitoId = await createCognitoUser(email, firstName, lastName, "teacher");

    // 2. Create in MongoDB
    const userResult = await db.collection("users").insertOne({
      cognitoId,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      role: "teacher",
      organizationIds: [orgObjectId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    finalTeacherId = userResult.insertedId;
  } else if (teacherId) {
    finalTeacherId = new ObjectId(teacherId);
  }

  const subjectData: any = {
    name,
    organizationId: orgObjectId,
    teacherId: finalTeacherId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("subjects").insertOne(subjectData);
  const subjectIdResult = result.insertedId;

  // Initialize Assistant for this subject
  await db.collection("assistants").insertOne({
    name: "Anna",
    tone: "friendly",
    voice: "neutral",
    teacherId: finalTeacherId,
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
