import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { uploadContentToS3 } from "../../../_helpers/uploadFileToS3";
import { sendEmail } from "../../../_helpers/email/sendEmail";

const cognitoClient = new CognitoIdentityProviderClient({ region: "eu-south-1" });
const USER_POOL_ID = process.env.COGNITO_POOL_ID;

interface StaffMember {
  firstName: string;
  lastName: string;
  email: string;
  role: 'teacher' | 'admin';
  _id?: string; // Temp ID from frontend
}

interface Student {
  firstName: string;
  lastName: string;
  email: string;
  _id?: string; // Temp ID from frontend
}

interface Subject {
  name: string;
  teacherId: string; // Temp ID from frontend
  _id?: string; // Temp ID from frontend
}

interface Class {
  name: string;
  students: Student[];
  _id?: string; // Temp ID from frontend
}

interface Assignment {
  teacherId: string; // Temp ID from frontend
  subjectId: string; // Temp ID from frontend
  classId: string;   // Temp ID from frontend
}

interface OnboardingPayload {
  orgData: {
    name: string;
    logoUrl: string;
  };
  staffList: StaffMember[];
  subjectsList: Subject[];
  classesList: Class[];
  assignmentsList: Assignment[];
}

const createCognitoUser = async (email: string, firstName: string, lastName: string, role: string) => {
  if (!USER_POOL_ID) throw new Error("COGNITO_POOL_ID not configured");

  const groupName = role === 'teacher' ? 'teachers' : (role === 'admin' ? 'admins' : 'students');
  const tempPassword = Math.random().toString(36).slice(-10) + "!" + Math.floor(Math.random() * 10);

  try {
    // Note: MessageAction is "SUPPRESS" to avoid default email
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email.trim() },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });

    const result = await cognitoClient.send(createCommand);
    const cognitoSub = result.User?.Attributes?.find(a => a.Name === "sub")?.Value;

    if (!cognitoSub) throw new Error("Sub not found in Cognito response");

    // Imposta la password temporanea
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      Password: tempPassword,
      Permanent: false,
    }));

    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      GroupName: groupName,
    });
    await cognitoClient.send(addToGroupCommand);

    // Invia email personalizzata via SES
    const roleLabel = role === 'admin' ? 'Amministratore' : (role === 'teacher' ? 'Docente' : 'Studente');
    await sendEmail(
      email.trim(),
      "Benvenuto su Syllex - Le tue credenziali",
      getWelcomeEmailHtml(firstName, email.trim(), tempPassword, roleLabel)
    );

    return cognitoSub;
  } catch (error: any) {
    // If user already exists, we might want to just link it, but for onboarding we expect new users
    if (error.name === 'UsernameExistsException') {
      console.log(`User ${email} already exists in Cognito, skipping creation.`);
      // In a real scenario, we'd fetch the sub
      throw createError.Conflict(`User ${email} already exists`);
    }
    throw error;
  }
};

const getWelcomeEmailHtml = (firstName: string, email: string, password: string, role: string) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 12px; color: #333; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #007bff; margin: 0; font-size: 28px;">Syllex</h2>
        <p style="color: #666; margin-top: 5px; font-size: 14px;">La tua piattaforma per la didattica</p>
      </div>
      
      <p style="font-size: 16px;">Ciao <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px;">Il tuo account come <strong>${role}</strong> è stato creato correttamente dal tuo amministratore.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #495057;">Dettagli Account:</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Password Temporanea:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; color: #d63384;">${password}</code></p>
      </div>
      
      <p style="font-size: 14px; color: #666;">Al primo accesso ti verrà richiesto di cambiare questa password per la tua sicurezza.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://app.syllex.app" style="background-color: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Accedi ora</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">Hai ricevuto questa email perché sei stato registrato su Syllex.<br>Se pensi si tratti di un errore, ignora questa comunicazione.</p>
    </div>
  `;
};

const onboardingHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const payload = JSON.parse(request.body || "{}") as OnboardingPayload;

  if (!payload.orgData?.name) {
    throw createError.BadRequest("Organization name is required");
  }

  const db = await getDefaultDatabase();
  
  // 0. Handle Logo Upload if present (Base64 from frontend)
  let logoUrl = payload.orgData.logoUrl;
  if (logoUrl && logoUrl.startsWith('data:image')) {
    try {
      const base64Data = logoUrl.split(',')[1];
      const mimeType = logoUrl.split(';')[0].split(':')[1];
      const extension = mimeType.split('/')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const key = `logos/${new ObjectId().toString()}.${extension}`;
      
      const s3Url = await uploadContentToS3(key, buffer, mimeType);
      if (s3Url) logoUrl = s3Url;
    } catch (s3Err) {
      console.error("S3 Upload failed, keeping base64 or empty", s3Err);
    }
  }

  // 1. Create Organization
  const orgResult = await db.collection("organizations").insertOne({
    name: payload.orgData.name,
    logoUrl: logoUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
    administrators: [] // Will populate later
  });
  const orgId = orgResult.insertedId;

  // Mapping from temp frontend IDs to real MongoDB ObjectIds
  const staffIdMap = new Map<string, ObjectId>();
  const subjectIdMap = new Map<string, ObjectId>();
  const classIdMap = new Map<string, ObjectId>();
  const studentIdMap = new Map<string, ObjectId>();

  // 2. Process Staff
  const adminIds: ObjectId[] = [];
  for (const staff of payload.staffList) {
    const cognitoId = await createCognitoUser(staff.email, staff.firstName, staff.lastName, staff.role);
    const userResult = await db.collection("users").insertOne({
      cognitoId,
      email: staff.email.toLowerCase(),
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      organizationIds: [orgId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const realId = userResult.insertedId;
    if (staff._id) staffIdMap.set(staff._id, realId);
    if (staff.role === 'admin') adminIds.push(realId);
  }

  // Update Org with admins
  await db.collection("organizations").updateOne(
    { _id: orgId },
    { $set: { administrators: adminIds } }
  );

  // 3. Process Subjects
  for (const sub of payload.subjectsList) {
    const teacherId = staffIdMap.get(sub.teacherId);
    if (!teacherId) continue;

    const subResult = await db.collection("subjects").insertOne({
      name: sub.name,
      teacherId,
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (sub._id) subjectIdMap.set(sub._id, subResult.insertedId);
  }

  // 4. Process Classes & Students
  for (const cls of payload.classesList) {
    const studentIds: ObjectId[] = [];
    
    for (const std of cls.students) {
      const cognitoId = await createCognitoUser(std.email, std.firstName, std.lastName, 'student');
      const userResult = await db.collection("users").insertOne({
        cognitoId,
        email: std.email.toLowerCase(),
        firstName: std.firstName,
        lastName: std.lastName,
        role: 'student',
        organizationIds: [orgId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      studentIds.push(userResult.insertedId);
    }

    const classResult = await db.collection("classes").insertOne({
      name: cls.name,
      organizationId: orgId,
      students: studentIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (cls._id) classIdMap.set(cls._id, classResult.insertedId);
  }

  // 5. Create Assignments
  for (const asg of payload.assignmentsList) {
    const teacherId = staffIdMap.get(asg.teacherId);
    const subjectId = subjectIdMap.get(asg.subjectId);
    const classId = classIdMap.get(asg.classId);

    if (teacherId && subjectId && classId) {
      await db.collection("teacher_assignments").insertOne({
        teacherId,
        subjectId,
        classId,
        organizationId: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return {
    success: true,
    organizationId: orgId.toString(),
    message: "Onboarding initiated correctly. Emails are being sent."
  };
};

export const handler = lambdaRequest(onboardingHandler);
