import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { MaterialDocument } from "./createMaterialWithFiles";

/**
 * Funzione Lambda per spostare un materiale in un'altra cartella.
 * Esegue una validazione dei permessi basata sugli incarichi del docente.
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

  const { materialId, targetFolderId: targetFolderIdString } = JSON.parse(
    req.body || "{}"
  );

  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID del materiale non valido o mancante." });
  }

  // Il folderId può essere null (per la root), quindi la validazione è diversa
  const targetFolderId =
    targetFolderIdString && ObjectId.isValid(targetFolderIdString)
      ? new ObjectId(targetFolderIdString)
      : null;

  const materialObjectId = new ObjectId(materialId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection<MaterialDocument>("materials");
    const classesCollection = db.collection("classes");

    // 1. Troviamo il materiale per ottenere il suo subjectId
    const materialToMove = await materialsCollection.findOne({
      _id: materialObjectId,
    });
    if (!materialToMove) {
      return res.status(404).json({ message: "Materiale non trovato." });
    }

    // 2. Verifichiamo che il docente insegni la materia di questo materiale
    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": materialToMove.subjectId,
    });

    if (assignmentCount === 0) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a modificare i materiali di questa materia.",
      });
    }

    // 3. Eseguiamo l'aggiornamento
    const updateResult = await materialsCollection.updateOne(
      { _id: materialObjectId },
      { $set: { folderId: targetFolderId, updatedAt: new Date() } }
    );

    if (updateResult.modifiedCount === 0) {
      // Potrebbe significare che il materiale era già in quella cartella
      console.log(
        `[Docente] Lo spostamento del materiale ${materialId} non ha comportato modifiche.`
      );
    }

    return res.status(200).json({
      message: "Materiale spostato con successo!",
    });
  } catch (error) {
    console.error("Errore durante lo spostamento del materiale:", error);
    return res.status(500).json({
      message: "Errore del server durante lo spostamento del materiale.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
