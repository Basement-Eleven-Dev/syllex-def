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
 * Funzione Lambda per rimuovere uno studente da una classe.
 * Accessibile ad admin e docenti con i permessi corretti.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  // 1. Sicurezza: Solo admin e docenti possono usare questa funzione
  if (!user || !["admin", "teacher"].includes(user.role)) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { classId, studentId } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }
  if (!studentId || !ObjectId.isValid(studentId)) {
    return res
      .status(400)
      .json({ message: "ID dello studente non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);
  const studentObjectId = new ObjectId(studentId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const targetClass = await classesCollection.findOne({ _id: classObjectId });
    if (!targetClass) {
      return res.status(404).json({ message: "Classe non trovata." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(targetClass.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      isAuthorized =
        targetClass.teachingAssignments?.some((a) =>
          a.teacherId.equals(user._id)
        ) || false;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a modificare gli iscritti di questa classe.",
      });
    }

    const updateResult = await classesCollection.findOneAndUpdate(
      { _id: classObjectId },
      { $pull: { studentIds: studentObjectId } },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return res
        .status(404)
        .json({ message: "Classe non trovata durante l'aggiornamento." });
    }

    return res.status(200).json({
      message: "Studente rimosso con successo.",
      class: updateResult,
    });
  } catch (error) {
    console.error("Errore durante la rimozione dello studente:", error);
    return res.status(500).json({
      message: "Errore del server durante la rimozione dello studente.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
