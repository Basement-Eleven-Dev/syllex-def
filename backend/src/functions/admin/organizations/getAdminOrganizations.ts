import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../../_helpers/getDatabase";
import { DB_NAME } from "../../../_helpers/config/env";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";

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

  if (!user.organizationIds || user.organizationIds.length === 0) {
    return res.status(200).json({ organizations: [] });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const organizationsCollection = db.collection("organizations");

    const organizations = await organizationsCollection
      .find({
        _id: { $in: user.organizationIds },
      })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      message: "Organizzazioni recuperate con successo.",
      organizations: organizations,
    });
  } catch (error) {
    console.error("Errore durante il recupero delle organizzazioni:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle organizzazioni.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
