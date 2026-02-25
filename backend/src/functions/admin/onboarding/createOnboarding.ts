import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { createCognitoUser } from "../../../_helpers/cognito/userManagement";
import { uploadContentToS3 } from "../../../_helpers/uploadFileToS3";


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
      year: 2026, // Aggiunto per consistenza con dati legacy
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
