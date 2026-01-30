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

  const submissionId = req.queryStringParameters?.submissionId as string;

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return res
      .status(400)
      .json({ message: "ID dello svolgimento non valido o mancante." });
  }

  const submissionObjectId = new ObjectId(submissionId);
  const studentId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const submissionsCollection = db.collection("selfAssessmentSubmissions");

    const aggregationPipeline = [
      {
        $match: {
          _id: submissionObjectId,
          studentId: studentId,
          status: "graded",
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
    ];

    const result = await submissionsCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (result.length === 0) {
      return res.status(404).json({
        message:
          "Risultato non trovato, non ancora completato o non autorizzato.",
      });
    }

    const submission = result[0];

    submission.testId = submission.testDetails;
    delete submission.testDetails;

    return res.status(200).json({ submission: submission });
  } catch (error) {
    return res.status(500).json({
      message: "Errore del server durante il recupero dei risultati.",
    });
  }
};
