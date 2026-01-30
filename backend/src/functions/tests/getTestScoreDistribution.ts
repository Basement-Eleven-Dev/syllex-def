import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { ObjectId } from "mongodb";
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
  let testId = req.queryStringParameters?.testId as string;

  if (user?.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }
  if (!testId) {
    return res.status(404).json({ message: "Not Found." });
  }

  const teacherId = user._id;

  try {
    const client = await mongoClient();
    const test = await client
      .db(DB_NAME)
      .collection("tests")
      .findOne({
        _id: new ObjectId(testId),
        teacherId: teacherId,
      });

    const submissions = await client
      .db(DB_NAME)
      .collection("testsubmissions")
      .findOne(
        { testId: test?._id, status: "graded" },
        {
          projection: {
            totalScoreAwarded: 1,
          },
        }
      );

    if (test && !submissions?.length) {
      return res.status(200).json({
        message: "Nessuno svolgimento corretto trovato per questo test.",
        distribution: [],
        testTitle: test.title,
        totalPossiblePoints: test.totalPoints || 0,
      });
    }

    // Calcola la distribuzione dei punteggi in fasce percentuali
    // (es. 0-25%, 26-50%, 51-75%, 76-100% del totalPossiblePoints)
    const totalPossiblePoints = test?.totalPoints || 1; // Evita divisione per zero se totalPoints è 0
    const distributionData = [
      { name: "0-25%", value: 0 },
      { name: "26-50%", value: 0 },
      { name: "51-75%", value: 0 },
      { name: "76-100%", value: 0 },
    ];

    if (submissions)
      submissions.forEach((sub: { totalScoreAwarded: number }) => {
        const score = sub.totalScoreAwarded || 0;
        const percentage = (score / totalPossiblePoints) * 100;
        if (percentage <= 25) distributionData[0].value++;
        else if (percentage <= 50) distributionData[1].value++;
        else if (percentage <= 75) distributionData[2].value++;
        else distributionData[3].value++;
      });

    return res.status(200).json({
      testTitle: test?.title,
      totalPossiblePoints: test?.totalPoints,
      distribution: distributionData,
    });
  } catch (error) {
    console.error("Errore recupero punteggio test:", error);
    return res.status(500).json({
      message: "Errore server recupero test docente.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
