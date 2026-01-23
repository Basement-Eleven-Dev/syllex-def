import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Test } from "./createTest";

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

  const testId = req.queryStringParameters?.testId;

  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({ message: "ID del test non valido o mancante." });
  }

  const testObjectId = new ObjectId(testId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection<Test>("tests");
    const assignmentsCollection = db.collection("testAssignments");
    const submissionsCollection = db.collection("testsubmissions");
    const classesCollection = db.collection("classes");

    const test = await testsCollection.findOne({ _id: testObjectId });
    if (!test) {
      return res.status(404).json({ message: "Test non trovato." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) => id.equals(test.organizationId)) ||
        false;
    } else if (user.role === "teacher") {
      const assignmentCount = await classesCollection.countDocuments({
        "teachingAssignments.teacherId": user._id,
        "teachingAssignments.subjectId": test.subjectId,
      });
      isAuthorized = assignmentCount > 0;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a visualizzare gli svolgimenti di questo test.",
      });
    }

    const assignments = await assignmentsCollection
      .find({ testId: testObjectId })
      .project({ _id: 1 })
      .toArray();
    const assignmentIds = assignments.map((a) => a._id);

    if (assignmentIds.length === 0) {
      return res.status(200).json({ submissions: [] });
    }

    const submissionsPipeline = [
      { $match: { assignmentId: { $in: assignmentIds } } },
      { $sort: { submittedAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
          pipeline: [{ $project: { firstName: 1, lastName: 1, username: 1 } }],
        },
      },
      {
        $lookup: {
          from: "testAssignments",
          localField: "assignmentId",
          foreignField: "_id",
          as: "assignmentInfo",
        },
      },
      { $unwind: "$assignmentInfo" },
      {
        $lookup: {
          from: "classes",
          localField: "assignmentInfo.classId",
          foreignField: "_id",
          as: "classInfo",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$classInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          status: 1,
          submittedAt: 1,
          totalScoreAwarded: 1,
          studentId: "$studentInfo",
          classInfo: "$classInfo",
        },
      },
    ];

    const submissions = await submissionsCollection
      .aggregate(submissionsPipeline)
      .toArray();

    return res.status(200).json({ submissions: submissions });
  } catch (error: any) {
    console.error("Errore durante il recupero delle consegne:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle consegne.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
