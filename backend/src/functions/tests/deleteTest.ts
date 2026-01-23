import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { ObjectId, Db } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { Test } from "./createTest";

/**
 * Funzione Lambda per eliminare un test "modello" e tutte le sue
 * assegnazioni e svolgimenti associati.
 * Accessibile ad admin e al docente creatore.
 */
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

  const { testId } = JSON.parse(req.body || "{}");

  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({ message: "ID del test mancante o non valido." });
  }

  const testObjectId = new ObjectId(testId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection<Test>("tests");
    const assignmentsCollection = db.collection("testAssignments");
    const submissionsCollection = db.collection("testsubmissions");

    // 1. Troviamo il test per poter verificare i permessi
    const testToDelete = await testsCollection.findOne({ _id: testObjectId });

    if (!testToDelete) {
      return res.status(404).json({ message: "Test non trovato." });
    }

    // 2. Logica di autorizzazione basata sul ruolo
    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(testToDelete.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      isAuthorized = testToDelete.teacherId?.equals(user._id) || false;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a eliminare questo test." });
    }

    // 3. Troviamo tutte le assegnazioni legate a questo test
    const assignmentsToDelete = await assignmentsCollection
      .find({ testId: testObjectId })
      .project({ _id: 1 })
      .toArray();
    const assignmentIdsToDelete = assignmentsToDelete.map((a) => a._id);

    const deletionPromises: Promise<any>[] = [];

    // 4. Se esistono assegnazioni, prepariamo l'eliminazione degli svolgimenti
    if (assignmentIdsToDelete.length > 0) {
      deletionPromises.push(
        submissionsCollection.deleteMany({
          assignmentId: { $in: assignmentIdsToDelete },
        })
      );
      // E prepariamo l'eliminazione delle assegnazioni stesse
      deletionPromises.push(
        assignmentsCollection.deleteMany({
          _id: { $in: assignmentIdsToDelete },
        })
      );
    }

    // 5. Prepariamo l'eliminazione del test "modello"
    deletionPromises.push(testsCollection.deleteOne({ _id: testObjectId }));

    // 6. Eseguiamo tutte le operazioni di pulizia in parallelo
    await Promise.all(deletionPromises);

    return res.status(200).json({
      message:
        "Test, assegnazioni e svolgimenti associati sono stati eliminati con successo.",
    });
  } catch (error: any) {
    console.error("Errore durante l'eliminazione del test:", error);
    return res.status(500).json({
      message: "Errore del server durante l'eliminazione del test.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
