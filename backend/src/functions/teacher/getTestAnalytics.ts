import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const testId = req.queryStringParameters?.testId as string;
  if (!testId || !ObjectId.isValid(testId)) {
    res.status(400).json({ message: "ID del test non valido o mancante" });
  }

  const testObjectId = new ObjectId(testId);
  const teacherId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection("tests");
    const submissionsCollection = db.collection("testsubmissions");
    const classesCollection = db.collection("classes");

    const test = await testsCollection.findOne({
      _id: testObjectId,
      teacherId: teacherId,
    });
    if (!test) {
      return res.status(404).json({
        message: "Test non trovato o non autorizzato a visualizzarlo.",
      });
    }
    const totalPossiblePoints = test.totalPoints || 1;

    let totalAssignedStudents = 0;
    if (test.assignedToClassIds && test.assignedToClassIds.length > 0) {
      const assignedClasses = await classesCollection
        .find({
          _id: { $in: test.assignedToClassIds },
        })
        .project({ studentIds: 1 })
        .toArray();

      const allStudentsIds = assignedClasses.flatMap((c) =>
        c.studentIds.map((id: ObjectId) => id.toString())
      );
      const uniqueStudentIds = new Set(allStudentsIds);
      totalAssignedStudents = uniqueStudentIds.size;
    }

    // Pipeline di aggregazione per calcolare tutte le statistiche in una sola query
    const analyticsPipeline = [
      { $match: { testId: testObjectId, status: "graded" } }, // Analizza solo le consegne completate e valutate
      {
        $facet: {
          // Facet 1: Calcola i KPI generali
          kpis: [
            {
              $group: {
                _id: null,
                submissionCount: { $sum: 1 },
                averageScore: { $avg: "$totalScoreAwarded" },
              },
            },
          ],
          // Facet 2: Calcola la distribuzione dei voti in fasce percentuali
          scoreDistribution: [
            {
              $bucket: {
                groupBy: "$totalScoreAwarded",
                boundaries: [
                  0,
                  totalPossiblePoints * 0.26,
                  totalPossiblePoints * 0.51,
                  totalPossiblePoints * 0.76,
                ],
                default: "76-100%",
                output: {
                  count: { $sum: 1 },
                },
              },
            },
            {
              $project: {
                _id: 0,
                name: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$_id", 0] }, then: "0-25%" },
                      {
                        case: { $eq: ["$_id", totalPossiblePoints * 0.26] },
                        then: "26-50%",
                      },
                      {
                        case: { $eq: ["$_id", totalPossiblePoints * 0.51] },
                        then: "51-75%",
                      },
                    ],
                    default: "76-100%",
                  },
                },
                value: "$count",
              },
            },
          ],
          // Facet 3: Calcola le performance per ogni singola domanda
          questionPerformance: [
            { $unwind: "$answers" },
            {
              $group: {
                _id: "$answers.questionId",
                correctCount: {
                  $sum: { $cond: ["$answers.isCorrect", 1, 0] },
                },
                totalAttempts: { $sum: 1 },
                averageScore: { $avg: "$answers.scoreAwarded" },
              },
            },
            {
              $project: {
                _id: 0,
                questionId: { $toObjectId: "$_id" },
                correctPercentage: {
                  $multiply: [
                    { $divide: ["$correctCount", "$totalAttempts"] },
                    100,
                  ],
                },
                averageScore: "$averageScore",
              },
            },
          ],
        },
      },
    ];

    const results = await submissionsCollection
      .aggregate(analyticsPipeline)
      .toArray();

    if (results.length === 0 || !results[0].kpis[0]) {
      return res.status(200).json({
        message: "Nessuna consegna completata trovata per questo test.",
        analytics: null,
      });
    }

    const analyticsData = results[0];
    const questionPerformanceWithDetails = await Promise.all(
      analyticsData.questionPerformance.map(async (q: any) => {
        const questionDetail = test.questions.find((testQ: any) =>
          testQ._id.equals(q.questionId)
        );
        return {
          ...q,
          questionText: questionDetail
            ? questionDetail.questionText.substring(0, 50) + "..."
            : "Domanda non trovata",
          maxPoints: questionDetail ? questionDetail.points : 0,
        };
      })
    );

    const kpisWithTotalStudents = {
      ...analyticsData.kpis[0],
      totalAssignedStudents: totalAssignedStudents,
    };

    return res.status(200).json({
      analytics: {
        kpis: kpisWithTotalStudents,
        scoreDistribution: analyticsData.scoreDistribution,
        questionPerformance: questionPerformanceWithDetails,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Errore del server durante l'analisi del test." });
  }
};
