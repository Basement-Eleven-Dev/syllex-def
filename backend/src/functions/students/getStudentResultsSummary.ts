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
    const submissionsCollection = db.collection("testsubmissions");

    const results = await submissionsCollection
      .aggregate([
        // Fase 1: Prendi tutti i test ufficiali completati dello studente
        {
          $match: {
            studentId: studentId,
            status: { $in: ["submitted", "partially-graded", "graded"] },
          },
        },
        // Fase 2: Aggiungi un campo per identificarli
        {
          $addFields: { type: "official" },
        },
        // Fase 3: Unisci il risultato con tutti i test di autovalutazione completati
        {
          $unionWith: {
            coll: "selfAssessmentSubmissions",
            pipeline: [
              { $match: { studentId: studentId, status: "graded" } },
              { $addFields: { type: "self-assessment" } },
            ],
          },
        },
        // Fase 4: Ora che abbiamo un unico stream di dati, usiamo $facet per fare calcoli paralleli
        {
          $facet: {
            // --- Pipeline 1: Statistiche e Grafico ---
            summaryAndChart: [
              {
                $addFields: {
                  durationSeconds: {
                    $cond: {
                      if: { $and: ["$startedAt", "$submittedAt"] },
                      then: {
                        $divide: [
                          { $subtract: ["$submittedAt", "$startedAt"] },
                          1000,
                        ],
                      },
                      else: null,
                    },
                  },
                },
              },
              {
                $lookup: {
                  from: "tests",
                  localField: "testId",
                  foreignField: "_id",
                  as: "officialTestDetails",
                },
              },
              {
                $lookup: {
                  from: "selfAssessmentTests",
                  localField: "testId",
                  foreignField: "_id",
                  as: "selfAssessmentTestDetails",
                },
              },
              {
                $addFields: {
                  testDetails: {
                    $cond: {
                      if: { $eq: ["$type", "official"] },
                      then: { $arrayElemAt: ["$officialTestDetails", 0] },
                      else: {
                        $arrayElemAt: ["$selfAssessmentTestDetails", 0],
                      },
                    },
                  },
                },
              },
              {
                $addFields: {
                  totalPossiblePoints: {
                    $cond: {
                      if: { $eq: ["$type", "official"] },
                      then: "$testDetails.totalPoints",
                      else: {
                        $sum: {
                          $ifNull: ["$testDetails.questions.points", []],
                        },
                      },
                    },
                  },
                },
              },
              {
                $addFields: {
                  percentageScore: {
                    $cond: {
                      if: { $gt: ["$totalPossiblePoints", 0] },
                      then: {
                        $multiply: [
                          {
                            $divide: [
                              "$totalScoreAwarded",
                              "$totalPossiblePoints",
                            ],
                          },
                          100,
                        ],
                      },
                      else: 0,
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalTestsCompleted: { $sum: 1 },
                  averageScore: { $avg: "$percentageScore" },
                  averageOfficialScore: {
                    $avg: {
                      $cond: [
                        { $eq: ["$type", "official"] },
                        "$percentageScore",
                        null,
                      ],
                    },
                  },
                  averageSelfAssessmentScore: {
                    $avg: {
                      $cond: [
                        { $eq: ["$type", "self-assessment"] },
                        "$percentageScore",
                        null,
                      ],
                    },
                  },
                  performanceOverTime: {
                    $push: {
                      date: "$submittedAt",
                      score: "$percentageScore",
                      type: "$type",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalTestsCompleted: 1,
                  averageScore: {
                    $ifNull: [{ $round: ["$averageScore", 1] }, 0],
                  },
                  averageOfficialScore: {
                    $ifNull: [{ $round: ["$averageOfficialScore", 1] }, 0],
                  },
                  averageSelfAssessmentScore: {
                    $ifNull: [
                      { $round: ["$averageSelfAssessmentScore", 1] },
                      0,
                    ],
                  },
                  performanceOverTime: {
                    $sortArray: {
                      input: "$performanceOverTime",
                      sortBy: { date: 1 },
                    },
                  },
                },
              },
            ],
            // --- Pipeline 2: Lista Test Ufficiali ---
            officialTestsList: [
              { $match: { type: "official" } }, // Filtra solo i test ufficiali dal flusso unito
              { $sort: { submittedAt: -1 } },
              {
                $lookup: {
                  from: "tests",
                  localField: "testId",
                  foreignField: "_id",
                  as: "details",
                },
              },
              { $unwind: "$details" },
              {
                $project: {
                  _id: 0,
                  submissionId: "$_id",
                  title: "$details.title",
                  date: "$submittedAt",
                  score: "$totalScoreAwarded",
                  totalPoints: "$details.totalPoints",
                },
              },
            ],
            // --- Pipeline 3: Lista Test di Autovalutazione ---
            selfAssessmentTestsList: [
              { $match: { type: "self-assessment" } }, // Filtra solo le autovalutazioni
              {
                $group: {
                  _id: "$testId",
                  attempts: { $sum: 1 },
                  lastAttemptDate: { $max: "$submittedAt" },
                },
              },
              { $sort: { lastAttemptDate: -1 } },
              {
                $lookup: {
                  from: "selfAssessmentTests",
                  localField: "_id",
                  foreignField: "_id",
                  as: "details",
                },
              },
              { $unwind: "$details" },
              {
                $project: {
                  _id: 0,
                  testId: "$_id",
                  title: "$details.title",
                  attempts: 1,
                  lastAttemptDate: 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const facetResult = results[0] || {};
    const summaryData = (facetResult.summaryAndChart &&
      facetResult.summaryAndChart[0]) || {
      totalTestsCompleted: 0,
      averageScore: 0,
      averageOfficialScore: 0,
      averageSelfAssessmentScore: 0,
      performanceOverTime: [],
    };

    const finalResponse = {
      summary: summaryData,
      officialTests: facetResult.officialTestsList || [],
      selfAssessmentTests: facetResult.selfAssessmentTestsList || [],
    };

    return res.status(200).json({
      message: "Riepilogo delle performance recuperato con successo.",
      data: finalResponse,
    });
  } catch (error) {
    console.error("Errore in getStudentResultsSummary:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero del riepilogo.",
    });
  }
};
