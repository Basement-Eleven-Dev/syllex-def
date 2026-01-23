import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import * as bcrypt from "bcryptjs";
import { CorsEnabledAPIGatewayProxyResult, CustomHandler, Res } from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { Test } from "../tests/createTest";
import { TestAssignment } from "../tests/createTestAssignment";
import { Class } from "../class/createClass";

interface NewSubmission {
  assignmentId: ObjectId;
  testId: ObjectId;
  studentId: ObjectId;
  classId: ObjectId;
  status: "in-progress";
  startedAt: Date;
  answers: any[];
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

export const handler: CustomHandler = async (req: APIGatewayProxyEvent, $, $$, res: Res = new Res()): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Accesso negato. Solo gli studenti possono iniziare un test." });
  }

  const { assignmentId, password } = JSON.parse(req.body || "{}");
  if (!assignmentId || !ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ message: `ID Assegnazione non valido: ${assignmentId}` });
  }

  const studentMongoId: ObjectId = user._id;
  const assignmentObjectId = new ObjectId(assignmentId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const assignmentsCollection = db.collection<TestAssignment>("testAssignments");
    const testsCollection = db.collection<Test>("tests");
    const classesCollection = db.collection<Class>("classes");
    const submissionsCollection = db.collection("testsubmissions");

    const assignment = await assignmentsCollection.findOne({ _id: assignmentObjectId });
    if (!assignment) {
      return res.status(404).json({ message: "Assegnazione del test non trovata." });
    }

    const [targetClass, test] = await Promise.all([
      classesCollection.findOne({ _id: assignment.classId }),
      testsCollection.findOne({ _id: assignment.testId })
    ]);
    if (!targetClass || !test || test.status !== "published") {
      return res.status(404).json({ message: "Classe o test non trovati, o test non pubblicato." });
    }

    const isEnrolled = targetClass.studentIds.some((id) => id.equals(studentMongoId));
    if (!isEnrolled) {
      return res.status(403).json({ message: "Non sei autorizzato a svolgere questo test." });
    }

    if (assignment.passwordHash) {
      if (!password) {
        return res.status(401).json({ message: "Password richiesta.", requiresPassword: true });
      }
      const isMatch = await bcrypt.compare(password, assignment.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Password non corretta.", requiresPassword: true });
      }
    }

    const existingSubmission = await submissionsCollection.findOne({
      assignmentId: assignmentObjectId,
      studentId: studentMongoId
    });
    if (existingSubmission) {
      return res.status(409).json({ message: "Hai già avviato o completato questo test." });
    }

    const now = new Date();
    const newSubmissionData: NewSubmission = {
      assignmentId: assignmentObjectId,
      testId: assignment.testId,
      studentId: studentMongoId,
      classId: assignment.classId,
      status: "in-progress",
      startedAt: now,
      answers: [],
      createdAt: now,
      updatedAt: now
    };

    if (assignment.durationMinutes && assignment.durationMinutes > 0) {
      newSubmissionData.deadline = new Date(now.getTime() + assignment.durationMinutes * 60 * 1000);
    }

    const insertResult = await submissionsCollection.insertOne(newSubmissionData as any);
    const submission = await submissionsCollection.findOne({ _id: insertResult.insertedId });
    if (!submission) {
      throw new Error("Impossibile recuperare lo svolgimento appena creato.");
    }

    const questionsForStudent = test.questions
      ? test.questions.map((q: any) => ({
          _id: q._id?.toString(),
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || [],
          points: q.points
        }))
      : [];

    return res.status(200).json({
      message: "Svolgimento test iniziato!",
      submissionId: submission._id.toString(),
      testTitle: test.title,
      questions: questionsForStudent,
      deadline: submission.deadline?.toISOString() || undefined
    });
  } catch (error: any) {
    console.error("Errore durante l'avvio del test:", error);
    return res.status(500).json({
      message: "Errore del server durante l'avvio del test.",
      error: error.message
    });
  }
};
