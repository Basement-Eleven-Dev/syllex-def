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
import { Class } from "../class/createClass";

// Definiamo un'interfaccia per la risposta
interface MaterialAssignmentInfo {
  assignmentId: ObjectId;
  classId: ObjectId;
  materialId: ObjectId;
}

/**
 * Funzione Lambda per ottenere tutti gli incarichi a cui un materiale è assegnato.
 * Accessibile solo da docenti.
 */
export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Accesso negato. Riservato ai docenti." });
  }

  const { materialId } = JSON.parse(req.body || "{}");

  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID del materiale non valido o mancante." });
  }

  const materialObjectId = new ObjectId(materialId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    // Usiamo una pipeline di aggregazione per trovare gli incarichi
    const assignments = await classesCollection
      .aggregate<MaterialAssignmentInfo>([
        // 1. Filtra solo le classi che hanno il materiale in almeno un incarico
        {
          $match: {
            "teachingAssignments.assignedMaterialIds": materialObjectId,
          },
        },
        // 2. "Srotola" l'array degli incarichi per processarli singolarmente
        { $unwind: "$teachingAssignments" },
        // 3. Filtra di nuovo per tenere solo gli incarichi che contengono il materiale
        {
          $match: {
            "teachingAssignments.assignedMaterialIds": materialObjectId,
          },
        },
        // 4. Proietta i campi che ci interessano in un formato pulito
        {
          $project: {
            _id: 0,
            classId: "$_id",
            assignmentId: "$teachingAssignments.assignmentId",
            materialId: materialObjectId,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      message: "Assegnazioni del materiale recuperate con successo.",
      assignments: assignments,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero delle assegnazioni del materiale:",
      error
    );
    return res.status(500).json({
      message:
        "Errore del server durante il recupero delle assegnazioni del materiale.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
