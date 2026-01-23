import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { subjectId, classId, studentId } = JSON.parse(req.body || "{}");
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({ message: "ID della materia obbligatorio." });
  }

  try {
    const db = (await mongoClient()).db(DB_NAME);

    const relevantTests = await db
      .collection("tests")
      .find({
        subjectId: new ObjectId(subjectId),
      })
      .project({ _id: 1 })
      .toArray();

    if (relevantTests.length === 0) {
      return res.status(200).json({ submissions: [] }); // Nessun test per questa materia
    }
    const relevantTestIds = relevantTests.map((t) => t._id);

    const assignmentFilter: any = {
      teacherId: user._id,
      testId: { $in: relevantTestIds },
    };
    if (classId && ObjectId.isValid(classId)) {
      assignmentFilter.classId = new ObjectId(classId);
    }
    const relevantAssignments = await db
      .collection("testAssignments")
      .find(assignmentFilter)
      .project({ _id: 1 })
      .toArray();

    if (relevantAssignments.length === 0) {
      return res.status(200).json({ submissions: [] });
    }
    const relevantAssignmentIds = relevantAssignments.map((a) => a._id);

    const submissionFilter: any = {
      assignmentId: { $in: relevantAssignmentIds },
    };
    if (studentId && ObjectId.isValid(studentId)) {
      submissionFilter.studentId = new ObjectId(studentId);
    }

    const populatedSubmissions = await db
      .collection("testsubmissions")
      .aggregate([
        { $match: submissionFilter },
        { $sort: { submittedAt: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "studentId",
            foreignField: "_id",
            as: "studentDetails",
            pipeline: [
              { $project: { firstName: 1, lastName: 1, username: 1 } },
            ],
          },
        },
        {
          $lookup: {
            from: "tests",
            localField: "testId",
            foreignField: "_id",
            as: "testDetails",
            pipeline: [{ $project: { title: 1, totalPoints: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$studentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $unwind: { path: "$testDetails", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            status: 1,
            submittedAt: 1,
            gradedAt: 1,
            totalScoreAwarded: 1,
            classId: 1,
            studentId: "$studentDetails",
            testId: "$testDetails",
          },
        },
      ])
      .toArray();

    return res.status(200).json({ submissions: populatedSubmissions });
  } catch (error) {
    console.error("[Teacher Controller] Errore recupero submissions:", error);
    return res.status(500).json({
      message: "Errore server recupero submissions.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
