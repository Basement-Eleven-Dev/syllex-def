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

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return res.status(400).json({ message: "Accesso negato" });
  }

  const { organizationId } = JSON.parse(req.body || "{}");

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res
      .status(400)
      .json({ message: "ID dell'organizzazione non valido o mancante." });
  }

  const orgObjectId = new ObjectId(organizationId);

  if (!user.organizationIds?.some((id) => id.equals(orgObjectId))) {
    return res.status(403).json({
      message:
        "Non sei autorizzato a visualizzare i corsi di questa organizzazione.",
    });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const coursesCollection = db.collection("courses");

    const courses = await coursesCollection
      .find({
        organizationId: orgObjectId,
      })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      message: "Corsi recuperati con successo.",
      courses: courses,
    });
  } catch (error) {
    console.error("Errore durante il recupero dei corsi:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero dei corsi.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
