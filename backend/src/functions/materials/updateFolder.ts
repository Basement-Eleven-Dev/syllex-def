import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { Folder } from "./createFolder";
/**
 * Funzione Lambda per aggiornare il nome di una cartella.
 * Esegue controlli di sicurezza basati sugli incarichi del docente.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { folderId, newName, subjectId } = JSON.parse(req.body || "{}");

  if (!folderId || !ObjectId.isValid(folderId)) {
    return res
      .status(400)
      .json({ message: "ID della cartella non valido o mancante" });
  }
  if (!newName || typeof newName !== "string" || newName.trim() === "") {
    return res
      .status(400)
      .json({ message: "Il nuovo nome della cartella è obbligatorio" });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res
      .status(400)
      .json({ message: "ID della materia non valido o mancante." });
  }

  const folderObjectId = new ObjectId(folderId);
  const subjectObjectId = new ObjectId(subjectId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const foldersCollection = db.collection<Folder>("folders");
    const classesCollection = db.collection("classes");

    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": subjectObjectId,
    });
    if (assignmentCount === 0) {
      return res.status(403).json({
        message: "Non sei autorizzato a modificare cartelle in questa materia.",
      });
    }

    const filter = {
      _id: folderObjectId,
      teacherId: user._id,
      subjectId: subjectObjectId,
    };

    const updateResult = await foldersCollection.findOneAndUpdate(
      filter,
      {
        $set: {
          name: newName.trim(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return res.status(404).json({
        message:
          "Cartella non trovata, non autorizzato a modificarla, o non appartiene alla materia specificata.",
      });
    }

    return res.status(200).json({
      message: `Cartella rinominata in "${updateResult.name}" con successo!`,
      folder: updateResult,
    });
  } catch (error) {
    console.error("Errore durante la rinomina della cartella:", error);
    return res.status(500).json({
      message: "Errore del server durante la rinomina della cartella.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
