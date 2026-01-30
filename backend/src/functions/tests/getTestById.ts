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
import { Test } from "./createTest";

/**
 * Funzione Lambda per recuperare i dettagli di un singolo test "modello",
 * arricchiti con le informazioni della materia associata.
 * Esegue una validazione dei permessi basata sul ruolo dell'utente.
 */
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

  const { testId } = req.queryStringParameters || {};

  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({ message: "ID del test non valido o mancante." });
  }

  const testObjectId = new ObjectId(testId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection<Test>("tests");

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
      isAuthorized = test.teacherId?.equals(user._id) || false;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a visualizzare questo test." });
    }

    const aggregationPipeline = [
      { $match: { _id: testObjectId } },
      // Usiamo $lookup (un JOIN) per recuperare i dettagli della materia
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subjectDetails",
          pipeline: [{ $project: { name: 1 } }], // Prendiamo solo il nome
        },
      },
      // "Appiattiamo" il risultato del lookup per renderlo un oggetto singolo
      {
        $unwind: {
          path: "$subjectDetails",
          preserveNullAndEmptyArrays: true, // Non scartare il test se la materia viene cancellata
        },
      },
    ];

    const result = await testsCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Test non trovato durante la fase di popolamento." });
    }

    const populatedTest = result[0];

    return res.status(200).json({
      message: "Dettagli del test recuperati con successo.",
      test: populatedTest,
    });
  } catch (error) {
    console.error("Errore durante il recupero del test:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero del test.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
