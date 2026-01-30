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

  const { testId } = JSON.parse(req.body || "{}");
  if (!testId || !ObjectId.isValid(testId)) {
    return res.status(400).json({
      message: "Id test non valido",
    });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const submissionsCollection = db.collection("selfAssessmentSubmissions");

    const history = await submissionsCollection
      .aggregate([
        {
          $match: {
            studentId: studentId,
            testId: new ObjectId(testId),
            status: "graded",
          },
        },
        {
          $sort: {
            submittedAt: -1,
          },
        },
        {
          $lookup: {
            from: "selfAssessmentTests",
            localField: "testId",
            foreignField: "_id",
            as: "testDetails",
          },
        },
        {
          $unwind: {
            path: "$testDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            submissionDate: "$submittedAt",
            scoreAwarded: "$totalScoreAwarded",
            testTitle: {
              $ifNull: ["$testDetails.title", "Titolo non disponibile"],
            },
            totalPossiblePoints: {
              $sum: { $ifNull: ["$testDetails.questions.points", []] },
            },
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      message: `Cronologia per il test ${testId} recuperata con successo.`,
      data: history,
    });
  } catch (error) {
    console.error("ERRORE NELLA FUNZIONE getHistoryForSpecificTest:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero della cronologia.",
    });
  }
};
