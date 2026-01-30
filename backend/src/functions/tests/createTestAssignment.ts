import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import * as bcrypt from "bcryptjs";

export interface TestAssignment {
  _id?: ObjectId;
  testId: ObjectId;
  classId: ObjectId;
  teacherId: ObjectId;
  organizationId: ObjectId;
  availableFrom?: Date;
  availableUntil?: Date;
  durationMinutes?: number;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || !["admin", "teacher"].includes(user.role)) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const {
    testId,
    classId,
    availableFrom,
    availableUntil,
    durationMinutes,
    password,
  } = JSON.parse(req.body || "{}");

  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({ message: "ID del test non valido o mancante." });
  }
  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }

  const testObjectId = new ObjectId(testId);
  const classObjectId = new ObjectId(classId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection("tests");
    const classesCollection = db.collection("classes");

    const testToAssign = await testsCollection.findOne({ _id: testObjectId });
    const targetClass = await classesCollection.findOne({ _id: classObjectId });

    if (!testToAssign || !targetClass) {
      return res.status(404).json({ message: "Test o classe non trovati." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(targetClass.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      // Un docente può assegnare un test se insegna la materia di quel test in quella classe
      isAuthorized =
        targetClass.teachingAssignments?.some(
          (a: any) =>
            a.teacherId.equals(user._id) &&
            a.subjectId.equals(testToAssign.subjectId)
        ) || false;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message:
          "Non sei autorizzato ad assegnare questo test a questa classe.",
      });
    }

    const newAssignmentDoc: Omit<TestAssignment, "_id"> = {
      testId: testObjectId,
      classId: classObjectId,
      teacherId: user._id,
      organizationId: targetClass.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (availableFrom) newAssignmentDoc.availableFrom = new Date(availableFrom);
    if (availableUntil)
      newAssignmentDoc.availableUntil = new Date(availableUntil);
    if (durationMinutes)
      newAssignmentDoc.durationMinutes = parseInt(durationMinutes, 10);
    if (password) {
      newAssignmentDoc.passwordHash = await bcrypt.hash(password, 10);
    }

    const assignmentsCollection = db.collection("testAssignments");
    const result = await assignmentsCollection.insertOne(newAssignmentDoc);

    const insertedAssignment = { ...newAssignmentDoc, _id: result.insertedId };

    return res.status(201).json({
      message: `Test assegnato con successo alla classe "${targetClass.name}"!`,
      assignment: insertedAssignment,
    });
  } catch (error) {
    console.error("Errore durante l'assegnazione del test:", error);
    return res.status(500).json({
      message: "Errore del server durante l'assegnazione del test.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
