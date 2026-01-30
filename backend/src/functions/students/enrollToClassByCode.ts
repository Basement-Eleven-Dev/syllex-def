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
import { Class } from "../class/createClass"; // Importiamo la nostra interfaccia Class

/**
 * Funzione Lambda per iscrivere uno studente a una classe tramite un codice di iscrizione.
 * Esegue controlli di sicurezza per assicurare la coerenza dell'organizzazione.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Accesso negato. Riservato agli studenti." });
  }

  const { enrollmentCode } = JSON.parse(req.body || "{}");

  if (
    !enrollmentCode ||
    typeof enrollmentCode !== "string" ||
    enrollmentCode.trim() === ""
  ) {
    return res
      .status(400)
      .json({ message: "Codice di iscrizione non valido o mancante." });
  }

  const studentId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const classToEnroll = await classesCollection.findOne({
      enrollmentCode: enrollmentCode.trim().toUpperCase(), // Normalizziamo il codice per sicurezza
    });

    if (!classToEnroll) {
      return res.status(404).json({
        message:
          "Nessuna classe trovata con questo codice. Controlla che sia corretto.",
      });
    }

    if (
      !user.organizationIds?.some((id) =>
        id.equals(classToEnroll.organizationId)
      )
    ) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a iscriverti a classi di un'altra organizzazione.",
      });
    }

    const isAlreadyEnrolled = classToEnroll.studentIds?.some((id: ObjectId) =>
      id.equals(studentId)
    );
    if (isAlreadyEnrolled) {
      return res.status(409).json({
        message: `Sei già iscritto alla classe "${classToEnroll.name}".`,
        class: classToEnroll,
      });
    }

    const updateResult = await classesCollection.findOneAndUpdate(
      { _id: classToEnroll._id },
      { $addToSet: { studentIds: studentId } },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      // Questo errore non dovrebbe mai accadere se i controlli precedenti sono passati
      throw new Error(
        "Aggiornamento della classe fallito dopo i controlli iniziali."
      );
    }

    return res.status(200).json({
      message: `Iscrizione alla classe "${updateResult.name}" avvenuta con successo!`,
      class: updateResult,
    });
  } catch (error) {
    console.error("Errore durante l'iscrizione tramite codice:", error);
    return res.status(500).json({
      message: "Errore del server durante l'iscrizione alla classe.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
