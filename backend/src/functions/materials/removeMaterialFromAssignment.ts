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
import { Class } from "../class/createClass";

/**
 * Funzione Lambda per rimuovere un materiale da uno specifico incarico di insegnamento.
 * Accessibile solo dal docente titolare di quell'incarico.
 */
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

  const { assignmentId, materialId } = JSON.parse(req.body || "{}");

  if (!assignmentId || !ObjectId.isValid(assignmentId)) {
    return res
      .status(400)
      .json({ message: "ID dell'incarico non valido o mancante." });
  }
  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID del materiale non valido o mancante." });
  }

  const assignmentObjectId = new ObjectId(assignmentId);
  const materialObjectId = new ObjectId(materialId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    // Verifica che l'utente sia autorizzato a modificare questo incarico
    const targetClass = await classesCollection.findOne({
      "teachingAssignments.assignmentId": assignmentObjectId,
      "teachingAssignments.teacherId": user._id,
    });

    if (!targetClass) {
      return res.status(403).json({
        message: "Incarico non trovato o non sei autorizzato a modificarlo.",
      });
    }

    // Usa l'operatore $pull per rimuovere l'ID del materiale dall'array
    const updateResult = await classesCollection.updateOne(
      {
        "teachingAssignments.assignmentId": assignmentObjectId,
      },
      {
        $pull: {
          "teachingAssignments.$.assignedMaterialIds": materialObjectId,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn(
        `[Docente] Nessuna modifica. Il materiale ${materialId} non era assegnato all'incarico ${assignmentId}.`
      );
    }

    return res.status(200).json({
      message: "Assegnazione del materiale rimossa con successo!",
    });
  } catch (error) {
    console.error(
      "Errore durante la rimozione dell'assegnazione del materiale:",
      error
    );
    return res.status(500).json({
      message:
        "Errore del server durante la rimozione dell'assegnazione del materiale.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
