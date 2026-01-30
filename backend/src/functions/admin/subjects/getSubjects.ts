import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_lambda/lambdaProxyResponse";
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
    return res
      .status(403)
      .json({
        message: "Accesso negato. Funzionalità riservata agli amministratori.",
      });
  }

  const { subjectIds } = JSON.parse(req.body || "{}");

  if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
    return res.status(200).json({ subjects: [] });
  }

  if (subjectIds.some((id: string) => !ObjectId.isValid(id))) {
    return res
      .status(400)
      .json({ message: "Uno o più ID di materia non sono validi." });
  }

  const subjectObjectIds = subjectIds.map((id: string) => new ObjectId(id));

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const subjectsCollection = db.collection("subjects");

    const subjects = await subjectsCollection
      .find({
        _id: { $in: subjectObjectIds },
      })
      .toArray();

    const isAuthorized = subjects.every((subject) =>
      user.organizationIds?.some((orgId) =>
        orgId.equals(subject.organizationId)
      )
    );

    if (!isAuthorized) {
      return res
        .status(403)
        .json({
          message:
            "Non sei autorizzato a visualizzare una o più delle materie richieste.",
        });
    }

    return res.status(200).json({
      message: "Materie recuperate con successo.",
      subjects: subjects,
    });
  } catch (error) {
    console.error("Errore durante il recupero delle materie:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle materie.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
