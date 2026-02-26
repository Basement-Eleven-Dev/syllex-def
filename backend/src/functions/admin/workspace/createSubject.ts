import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const createSubjectHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const orgId = request.pathParameters?.organizationId;
  if (!orgId) throw createError.BadRequest("Organization ID is required");

  const { name, teacherId } = JSON.parse(request.body || "{}");
  if (!name) throw createError.BadRequest("Subject name is required");

  const db = await getDefaultDatabase();
  
  const subjectData: any = {
    name,
    organizationId: new ObjectId(orgId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (teacherId) {
    subjectData.teacherId = new ObjectId(teacherId);
  }

  const result = await db.collection("subjects").insertOne(subjectData);
  const subjectId = result.insertedId;

  // Initialize Assistant for this subject
  await db.collection("assistants").insertOne({
    name: "Anna",
    tone: "friendly",
    voice: "neutral",
    teacherId: subjectData.teacherId || null,
    subjectId,
    organizationId: new ObjectId(orgId),
    associatedFileIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    subjectId: subjectId.toString(),
    message: "Materia creata con successo"
  };
};

export const handler = lambdaRequest(createSubjectHandler);
