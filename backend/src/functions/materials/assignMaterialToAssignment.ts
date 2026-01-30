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
import { Class } from "../class/createClass"; // Importiamo l'interfaccia Class

/**
 * Funzione Lambda per assegnare un materiale a uno specifico incarico di insegnamento.
 * Accessibile solo dal docente titolare di quell'incarico.
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

  const { classId, assignmentId, materialId } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }
  if (!assignmentId || !ObjectId.isValid(assignmentId)) {
    return res
      .status(400)
      .json({ message: "ID dell'incarico non valido o mancante." });
  }
  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID del materiale non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);
  const assignmentObjectId = new ObjectId(assignmentId);
  const materialObjectId = new ObjectId(materialId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const targetClass = await classesCollection.findOne({
      _id: classObjectId,
      "teachingAssignments.assignmentId": assignmentObjectId,
      "teachingAssignments.teacherId": user._id,
    });

    if (!targetClass) {
      return res.status(403).json({
        message: "Incarico non trovato o non sei autorizzato a modificarlo.",
      });
    }

    const updateResult = await classesCollection.updateOne(
      {
        _id: classObjectId,
        "teachingAssignments.assignmentId": assignmentObjectId,
      },
      {
        $addToSet: {
          "teachingAssignments.$.assignedMaterialIds": materialObjectId,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.log(
        `[Docente] Il materiale ${materialId} era probabilmente già assegnato all'incarico ${assignmentId}.`
      );
    }

    const updatedClass = await classesCollection.findOne({
      _id: classObjectId,
    });

    return res.status(200).json({
      message: "Materiale assegnato con successo!",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Errore durante l'assegnazione del materiale:", error);
    return res.status(500).json({
      message: "Errore del server durante l'assegnazione del materiale.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
