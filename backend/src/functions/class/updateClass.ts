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
import { Class } from "./createClass"; // Importiamo la nostra interfaccia Class

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      message: "Accesso negato. Funzionalità riservata agli amministratori.",
    });
  }

  const { classId, name, description } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Il nome della classe è obbligatorio." });
  }

  const classObjectId = new ObjectId(classId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const classToUpdate = await classesCollection.findOne({
      _id: classObjectId,
    });
    if (!classToUpdate) {
      return res.status(404).json({ message: "Classe non trovata." });
    }

    if (
      !user.organizationIds?.some((id) =>
        id.equals(classToUpdate.organizationId)
      )
    ) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questa classe." });
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || "",
      updatedAt: new Date(),
    };

    const updateResult = await classesCollection.findOneAndUpdate(
      { _id: classObjectId },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return res
        .status(404)
        .json({ message: "Classe non trovata durante l'aggiornamento." });
    }

    return res.status(200).json({
      message: "Classe aggiornata con successo!",
      class: updateResult,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della classe:", error);
    return res.status(500).json({
      message: "Errore del server durante l'aggiornamento della classe.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
