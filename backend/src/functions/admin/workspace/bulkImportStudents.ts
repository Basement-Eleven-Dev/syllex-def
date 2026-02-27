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

  const studentIdsToAssign: ObjectId[] = [];

  for (const std of students) {
    const email = std.email.toLowerCase().trim();
    try {
      // 1. Check if user already exists
      let user = await db.collection("users").findOne({ email });

      if (user) {
        // Update user to ensure they are in this organization
        await db.collection("users").updateOne(
          { _id: user._id },
          { $addToSet: { organizationIds: orgObjectId }, $set: { updatedAt: new Date() } }
        );
        studentIdsToAssign.push(user._id);
      } else {
        // 2. Create new user
        try {
          const cognitoId = await createCognitoUser(email, std.firstName, std.lastName, 'student');
          
          const userResult = await db.collection("users").insertOne({
            cognitoId,
            email,
            firstName: std.firstName,
            lastName: std.lastName,
            role: 'student',
            organizationIds: [orgObjectId],
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          studentIdsToAssign.push(userResult.insertedId);
        } catch (cognitoError: any) {
          // If Cognito user already exists but not in our DB (unlikely but possible)
          if (cognitoError.name === 'UsernameExistsException') {
            console.log(`Cognito user already exists for ${email}, manual sync needed or handle specifically`);
          }
          throw cognitoError;
        }
      }
    } catch (error: any) {
      console.error(`Failed to process student ${std.email}:`, error);
      // We continue with others
    }
  }

  // 3. Update class students array with ALL processed students
  if (studentIdsToAssign.length > 0) {
    await db.collection("classes").updateOne(
      { _id: classObjectId, organizationId: orgObjectId },
      { $addToSet: { students: { $each: studentIdsToAssign } } }
    );
  }

  return {
    success: true,
    count: studentIdsToAssign.length,
    message: `${studentIdsToAssign.length} studenti processati correttamente.`
  };
};

export const handler = lambdaRequest(bulkImportStudents);
