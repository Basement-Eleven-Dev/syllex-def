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

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Accesso negato. Riservato ai docenti." });
  }

  const testId = req.queryStringParameters?.testId;

  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({
        message: "ID del test non valido o mancante nella query string.",
      });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testObjectId = new ObjectId(testId);

    const test = await db.collection("tests").findOne({ _id: testObjectId });
    if (!test) {
      return res.status(404).json({ message: "Test non trovato." });
    }

    const hasAccess = user.organizationIds?.some((orgId) =>
      orgId.equals(test.organizationId)
    );
    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Non autorizzato a visualizzare questo test." });
    }

    const assignments = await db
      .collection("testAssignments")
      .aggregate([
        { $match: { testId: testObjectId } },
        {
          $lookup: {
            from: "classes",
            localField: "classId",
            foreignField: "_id",
            as: "classInfo",
          },
        },
        {
          $unwind: {
            path: "$classInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            testId: 1,
            classId: 1,
            teacherId: 1,
            availableFrom: 1,
            availableUntil: 1,
            durationMinutes: 1,
            hasPassword: { $toBool: "$passwordHash" }, // Invia solo se c'è una password, non l'hash
            className: "$classInfo.name", // Aggiungiamo il nome della classe
          },
        },
      ])
      .toArray();

    return res.status(200).json({ assignments });
  } catch (error) {
    console.error("Errore nel recuperare le assegnazioni del test:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle assegnazioni.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
