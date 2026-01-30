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

export interface AssignedTestView {
  _id: ObjectId;
  title: string;
  description?: string;
  subjectName?: string;
  totalPoints: number;
  teacherName?: string;
  assignmentId: ObjectId;
  availableFrom?: Date;
  availableUntil?: Date;
  durationMinutes?: number;
  hasPassword?: boolean;
  studentSubmissionId?: ObjectId;
  studentSubmissionStatus?: string;
  studentTotalScoreAwarded?: number;
}

/**
 * Funzione che recupera una vista completa dei test assegnati allo studente.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");
    const assignmentsCollection = db.collection("testAssignments");

    const enrolledClasses = await classesCollection
      .find({ studentIds: user._id })
      .project({ _id: 1 })
      .toArray();
    const enrolledClassIds = enrolledClasses.map((c) => c._id);

    if (enrolledClassIds.length === 0) {
      return res.status(200).json({ tests: [] });
    }

    const aggregationPipeline: any[] = [
      { $match: { classId: { $in: enrolledClassIds } } },
      { $sort: { _id: -1 } },

      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacherInfo",
        },
      },
      { $unwind: { path: "$teacherInfo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testDetails",
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "testDetails.subjectId",
          foreignField: "_id",
          as: "subjectDetails",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "testsubmissions",
          let: { assignment_id: "$_id", student_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$assignmentId", "$$assignment_id"] },
                    { $eq: ["$studentId", "$$student_id"] },
                  ],
                },
              },
            },
          ],
          as: "studentSubmission",
        },
      },
      { $unwind: "$testDetails" },
      {
        $unwind: { path: "$subjectDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: {
          path: "$studentSubmission",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$testDetails._id",
          title: "$testDetails.title",
          description: "$testDetails.description",
          subjectName: "$subjectDetails.name",
          totalPoints: "$testDetails.totalPoints",
          teacherName: {
            $concat: ["$teacherInfo.firstName", " ", "$teacherInfo.lastName"],
          },
          assignmentId: "$_id",
          availableFrom: "$availableFrom",
          availableUntil: "$availableUntil",
          durationMinutes: "$durationMinutes",
          hasPassword: {
            $cond: { if: "$passwordHash", then: true, else: false },
          },
          studentSubmissionId: "$studentSubmission._id",
          studentSubmissionStatus: "$studentSubmission.status",
          studentTotalScoreAwarded: "$studentSubmission.totalScoreAwarded",
        },
      },
    ];

    const assignedTests = await assignmentsCollection
      .aggregate<AssignedTestView>(aggregationPipeline)
      .toArray();

    return res.status(200).json({
      message: "Test assegnati recuperati con successo.",
      tests: assignedTests,
    });
  } catch (error) {
    console.error("Errore durante il recupero dei test assegnati:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero dei test.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
