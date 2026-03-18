import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { User } from "../../../models/schemas/user.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { Class } from "../../../models/schemas/class.schema";
import { TeacherAssignment } from "../../../models/schemas/teacher-assignment.schema";

const createAssignment = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const { teacherId, subjectId, classId } = JSON.parse(request.body || '{}');

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!teacherId || !subjectId || !classId) {
    throw createError.BadRequest("Missing required fields: teacherId, subjectId, classId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  // Verify entities belongs to organization
  const teacher = await User.findOne({ _id: new mongo.ObjectId(teacherId), organizationIds: orgObjectId });
  if (!teacher) throw createError.NotFound("Docente non trovato in questa organizzazione");

  const subject = await Subject.findOne({ _id: new mongo.ObjectId(subjectId), organizationId: orgObjectId });
  if (!subject) throw createError.NotFound("Materia non trovata");

  const classData = await Class.findOne({ _id: new mongo.ObjectId(classId), organizationId: orgObjectId });
  if (!classData) throw createError.NotFound("Classe non trovata");

  // Check if assignment already exists
  const existing = await TeacherAssignment.findOne({
    teacherId: new mongo.ObjectId(teacherId),
    subjectId: new mongo.ObjectId(subjectId),
    classId: new mongo.ObjectId(classId),
    organizationId: orgObjectId
  });

  if (existing) {
    throw createError.Conflict("Questo docente è già associato a questa materia per questa classe");
  }

  const result = await TeacherAssignment.insertOne({
    teacherId: new mongo.ObjectId(teacherId),
    subjectId: new mongo.ObjectId(subjectId),
    classId: new mongo.ObjectId(classId),
    organizationId: orgObjectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    assignmentId: result._id.toString(),
    message: "Associazione creata con successo"
  };
};

export const handler = lambdaRequest(createAssignment);
