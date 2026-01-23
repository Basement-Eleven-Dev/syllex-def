import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Class } from "./createClass";

export interface TeachingAssignment {
  assignmentId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  assignedMaterialIds: ObjectId[];
}

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

  const { classId, subjectId, teacherId } = JSON.parse(req.body || "{}");
  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res
      .status(400)
      .json({ message: "ID della materia non valido o mancante." });
  }
  if (!teacherId || !ObjectId.isValid(teacherId)) {
    return res
      .status(400)
      .json({ message: "ID del docente non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);
  const subjectObjectId = new ObjectId(subjectId);
  const teacherObjectId = new ObjectId(teacherId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");

    const targetClass = await classesCollection.findOne({ _id: classObjectId });
    if (!targetClass) {
      return res.status(404).json({ message: "Classe non trovata." });
    }
    if (
      !user.organizationIds?.some((id) => id.equals(targetClass.organizationId))
    ) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questa classe." });
    }

    const newAssignment: TeachingAssignment = {
      assignmentId: new ObjectId(), // Un ID univoco per questo specifico incarico
      subjectId: subjectObjectId,
      teacherId: teacherObjectId,
      assignedMaterialIds: [],
    };

    const updateResult = await classesCollection.updateOne(
      { _id: classObjectId },
      { $addToSet: { teachingAssignments: newAssignment } }
    );

    if (updateResult.modifiedCount === 0) {
      // Questo potrebbe significare che l'incarico esiste già.
      // Per ora, lo trattiamo come un successo idempotente.
      console.log(
        `[Admin] L'incarico per la classe ${classId} potrebbe esistere già. Nessuna modifica apportata.`
      );
    }

    const updatedClass = await classesCollection.findOne({
      _id: classObjectId,
    });

    return res.status(200).json({
      message: `Docente assegnato con successo!`,
      class: updatedClass,
    });
  } catch (error) {
    console.error("Errore durante l'assegnazione del docente:", error);
    return res.status(500).json({
      message: "Errore del server durante l'assegnazione del docente.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
