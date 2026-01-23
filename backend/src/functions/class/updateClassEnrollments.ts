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
import { Class } from "./createClass";

/**
 * Funzione Lambda per aggiornare la lista degli studenti iscritti a una classe.
 * Accessibile solo dagli admin dell'organizzazione.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { classId, studentIds } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res.status(400).json({ message: "ID della classe non valido." });
  }
  if (!Array.isArray(studentIds)) {
    return res
      .status(400)
      .json({ message: "È necessario fornire un array di ID studente." });
  }

  const classObjectId = new ObjectId(classId);
  const studentObjectIds = studentIds
    .filter((id: string) => ObjectId.isValid(id))
    .map((id: string) => new ObjectId(id));

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const targetClass = await classesCollection.findOne({ _id: classObjectId });
    if (!targetClass) {
      return res.status(404).json({ message: "Classe non trovata." });
    }
    if (
      !user.organizationIds?.some((id) => id.equals(targetClass.organizationId))
    ) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questa classe." });
    }

    const updateResult = await classesCollection.findOneAndUpdate(
      { _id: classObjectId },
      { $set: { studentIds: studentObjectIds, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return res
        .status(404)
        .json({ message: "Classe non trovata durante l'aggiornamento." });
    }

    return res.status(200).json({
      message: "Elenco studenti aggiornato con successo!",
      class: updateResult,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento degli iscritti:", error);
    return res.status(500).json({
      message: "Errore del server durante l'aggiornamento degli iscritti.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
