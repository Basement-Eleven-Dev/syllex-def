import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
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
    const testsCollection = db.collection("selfAssessmentTests");

    const selfAssessmentTests = await testsCollection
      .aggregate([
        {
          $match: {
            studentId: studentId,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $lookup: {
            from: "selfAssessmentSubmissions",
            let: { testId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$testId", "$$testId"],
                  },
                },
              },
              { $sort: { startedAt: -1, createdAt: -1 } },
            ],
            as: "attempts",
          },
        },
      ])
      .toArray();

    const ensureIsoString = (value: any): string | null => {
      if (!value) {
        return null;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };

    const formattedTests = selfAssessmentTests.map((test: any) => {
      const totalPoints = Array.isArray(test.questions)
        ? test.questions.reduce(
          (sum: number, question: any) => sum + (question?.points ?? 0),
          0
        )
        : 0;

      const attempts = Array.isArray(test.attempts)
        ? test.attempts.map((attempt: any) => {
          const startedAt = ensureIsoString(attempt.startedAt);
          const submittedAt = ensureIsoString(attempt.submittedAt);

          let durationSeconds: number | null = null;
          if (startedAt && submittedAt) {
            const deltaMs =
              new Date(submittedAt).getTime() - new Date(startedAt).getTime();
            if (!Number.isNaN(deltaMs) && deltaMs > 0) {
              durationSeconds = Math.round(deltaMs / 1000);
            } else {
              durationSeconds = 0;
            }
          }

          return {
            submissionId: attempt._id?.toString() ?? null,
            status: attempt.status ?? "in-progress",
            startedAt,
            submittedAt,
            totalScoreAwarded:
              typeof attempt.totalScoreAwarded === "number"
                ? attempt.totalScoreAwarded
                : null,
            durationSeconds,
          };
        })
        : [];

      return {
        _id: test._id?.toString(),
        title: test.title,
        description: test.description ?? null,
        createdAt: ensureIsoString(test.createdAt),
        updatedAt: ensureIsoString(test.updatedAt),
        sourceMaterialIds: Array.isArray(test.sourceMaterialIds)
          ? test.sourceMaterialIds.map((id: ObjectId) => id.toString())
          : [],
        totalPoints,
        attempts,
      };
    });

    return res.status(200).json({ tests: formattedTests });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Errore nel recuper dei test di autovalutazione" });
  }
};
