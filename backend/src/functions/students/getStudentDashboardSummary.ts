import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

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

  const studentId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    const enrolledClasses = await db
      .collection("classes")
      .find({ studentIds: studentId })
      .project({ _id: 1 })
      .toArray();
    const enrolledClassIds = enrolledClasses.map((c) => c._id);
    const enrolledClassesCount = enrolledClassIds.length;

    let pendingTestsCount = 0;
    let nextDeadline = null;

    if (enrolledClassesCount > 0) {
      const assignmentsAndSubmissions = await db
        .collection("testAssignments")
        .aggregate([
          { $match: { classId: { $in: enrolledClassIds } } },
          {
            $lookup: {
              from: "testsubmissions",
              let: { assignmentId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$assignmentId", "$$assignmentId"] },
                        { $eq: ["$studentId", studentId] },
                      ],
                    },
                  },
                },
              ],
              as: "submissionInfo",
            },
          },
          {
            $unwind: {
              path: "$submissionInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
        ])
        .toArray();

      const now = new Date();
      const pendingAssignments = assignmentsAndSubmissions.filter((a) => {
        const isSubmitted = !!a.submissionInfo;
        const isAvailable =
          !a.availableFrom || new Date(a.availableFrom) <= now;
        const isNotExpired =
          !a.availableUntil || new Date(a.availableUntil) >= now;
        return !isSubmitted && isAvailable && isNotExpired;
      });
      pendingTestsCount = pendingAssignments.length;

      const sortedPendingAssignments = pendingAssignments
        .filter((a) => a.availableUntil)
        .sort(
          (a, b) =>
            new Date(a.availableUntil).getTime() -
            new Date(b.availableUntil).getTime()
        );

      if (sortedPendingAssignments.length > 0) {
        nextDeadline = sortedPendingAssignments[0].availableUntil;
      }
    }

    let averageScore: number | null = null;

    const scoreCalculationResult = await db
      .collection("testsubmissions")
      .aggregate([
        { $match: { studentId: studentId, status: "graded" } },
        { $addFields: { type: "official" } },
        {
          $unionWith: {
            coll: "selfAssessmentSubmissions",
            pipeline: [
              { $match: { studentId: studentId, status: "graded" } },
              { $addFields: { type: "self-assessment" } },
            ],
          },
        },
        {
          $lookup: {
            from: "tests",
            localField: "testId",
            foreignField: "_id",
            as: "testDetails",
          },
        },

        { $unwind: { path: "$testDetails", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            totalPossiblePoints: "$testDetails.totalPoints",
          },
        },
        {
          $group: {
            _id: null,
            averagePercentage: {
              $avg: {
                $cond: {
                  if: { $gt: ["$totalPossiblePoints", 0] },
                  then: {
                    $multiply: [
                      {
                        $divide: ["$totalScoreAwarded", "$totalPossiblePoints"],
                      },
                      100,
                    ],
                  },
                  else: 0,
                },
              },
            },
          },
        },
      ])
      .toArray();

    if (
      scoreCalculationResult.length > 0 &&
      scoreCalculationResult[0].averagePercentage !== null
    ) {
      averageScore = Math.round(scoreCalculationResult[0].averagePercentage);
    }

    return res.status(200).json({
      summary: {
        enrolledClassesCount,
        pendingTestsCount,
        averageScore,
        nextDeadline,
      },
    });
  } catch (error) {
    console.error(
      "Errore del server durante il recupero del riepilogo:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero del riepilogo.",
    });
  }
};
