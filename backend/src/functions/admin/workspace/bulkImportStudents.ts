import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";

interface ImportStudent {
  firstName: string;
  lastName: string;
  email: string;
}

const bulkImportStudents = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;
  const { classId, students } = JSON.parse(request.body || '{}') as { classId: string, students: ImportStudent[] };

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  if (!classId || !ObjectId.isValid(classId)) {
    throw createError.BadRequest("Invalid or missing classId");
  }

  if (!students || !Array.isArray(students) || students.length === 0) {
    throw createError.BadRequest("Missing or invalid students list");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);
  const classObjectId = new ObjectId(classId);

  const importedStudentIds: ObjectId[] = [];

  for (const std of students) {
    try {
      const cognitoId = await createCognitoUser(std.email, std.firstName, std.lastName, 'student');
      
      const userResult = await db.collection("users").insertOne({
        cognitoId,
        email: std.email.toLowerCase().trim(),
        firstName: std.firstName,
        lastName: std.lastName,
        role: 'student',
        organizationIds: [orgObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      importedStudentIds.push(userResult.insertedId);
    } catch (error: any) {
      console.error(`Failed to import student ${std.email}:`, error);
      // We continue with others, but in a production app we might want to collect errors
    }
  }

  // Update class students array
  await db.collection("classes").updateOne(
    { _id: classObjectId, organizationId: orgObjectId },
    { $addToSet: { students: { $each: importedStudentIds } } }
  );

  return {
    success: true,
    count: importedStudentIds.length,
    message: `${importedStudentIds.length} students imported successfully.`
  };
};

export const handler = lambdaRequest(bulkImportStudents);
