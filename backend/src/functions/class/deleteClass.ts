import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

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

  const { classId } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");

    const classToDelete = await classesCollection.findOne({
      _id: classObjectId,
    });

    if (!classToDelete) {
      return res.status(404).json({ message: "Classe non trovata." });
    }

    if (
      !user.organizationIds?.some((id) =>
        id.equals(classToDelete.organizationId)
      )
    ) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a eliminare questa classe." });
    }

    const deleteResult = await classesCollection.deleteOne({
      _id: classObjectId,
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        message: "La classe non è stata trovata o era già stata eliminata.",
      });
    }

    return res.status(200).json({
      message: `Classe eliminata con successo!`,
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione della classe:", error);
    return res.status(500).json({
      message: "Errore del server durante l'eliminazione della classe.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
