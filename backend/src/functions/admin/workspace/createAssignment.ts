import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const createAssignment = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const { teacherId, subjectId, classId } = JSON.parse(request.body || '{}');

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!teacherId || !subjectId || !classId) {
    throw createError.BadRequest("Missing required fields: teacherId, subjectId, classId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // Verify entities belongs to organization
  const teacher = await db.collection("users").findOne({ _id: new ObjectId(teacherId), organizationIds: orgObjectId });
  if (!teacher) throw createError.NotFound("Docente non trovato in questa organizzazione");

  const subject = await db.collection("subjects").findOne({ _id: new ObjectId(subjectId), organizationId: orgObjectId });
  if (!subject) throw createError.NotFound("Materia non trovata");

  const classData = await db.collection("classes").findOne({ _id: new ObjectId(classId), organizationId: orgObjectId });
  if (!classData) throw createError.NotFound("Classe non trovata");

  // Check if assignment already exists
  const existing = await db.collection("teacher_assignments").findOne({
    teacherId: new ObjectId(teacherId),
    subjectId: new ObjectId(subjectId),
    classId: new ObjectId(classId),
    organizationId: orgObjectId
  });

  if (existing) {
    throw createError.Conflict("Questo docente è già associato a questa materia per questa classe");
  }

  const result = await db.collection("teacher_assignments").insertOne({
    teacherId: new ObjectId(teacherId),
    subjectId: new ObjectId(subjectId),
    classId: new ObjectId(classId),
    organizationId: orgObjectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    assignmentId: result.insertedId.toString(),
    message: "Associazione creata con successo"
  };
};

export const handler = lambdaRequest(createAssignment);
