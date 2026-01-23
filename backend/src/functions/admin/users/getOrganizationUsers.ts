import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../../_helpers/getDatabase";
import { DB_NAME } from "../../../_helpers/config/env";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";

/**
 * Funzione Lambda per recuperare tutti gli utenti (docenti e studenti)
 * associati a una specifica organizzazione.
 * Accessibile solo dagli admin di quella organizzazione.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: "Accesso negato. Funzionalità riservata agli amministratori.",
      });
  }

  const { organizationId } = JSON.parse(req.body || "{}");

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res
      .status(400)
      .json({ message: "ID dell'organizzazione non valido o mancante." });
  }

  const orgObjectId = new ObjectId(organizationId);

  if (!user.organizationIds?.some((id) => id.equals(orgObjectId))) {
    return res
      .status(403)
      .json({
        message:
          "Non sei autorizzato a visualizzare gli utenti di questa organizzazione.",
      });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const usersCollection = db.collection("users");

    const organizationUsers = await usersCollection
      .find({
        organizationIds: orgObjectId,
      })
      .sort({ role: 1, lastName: 1, firstName: 1 }) // Ordina per ruolo e poi alfabeticamente
      .toArray();

    return res.status(200).json({
      message: "Utenti recuperati con successo.",
      users: organizationUsers,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero degli utenti dell'organizzazione:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero degli utenti.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
