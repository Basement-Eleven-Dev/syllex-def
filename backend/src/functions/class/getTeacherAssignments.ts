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

export interface TeacherAssignment {
  assignmentId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  // Leggiamo il subjectId opzionale dal corpo della richiesta
  const { subjectId } = JSON.parse(req.body || "{}");

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");

    const aggregationPipeline: any[] = [
      { $match: { "teachingAssignments.teacherId": user._id } },
      { $unwind: "$teachingAssignments" },
      { $match: { "teachingAssignments.teacherId": user._id } },
    ];

    // --- LA CORREZIONE È QUI ---
    // Se un subjectId VALIDO è stato fornito, aggiungiamo il filtro. Altrimenti no.
    if (subjectId && ObjectId.isValid(subjectId)) {
      aggregationPipeline.push({
        $match: { "teachingAssignments.subjectId": new ObjectId(subjectId) },
      });
    }

    // Il resto della pipeline è invariato
    aggregationPipeline.push(
      {
        $lookup: {
          from: "subjects",
          localField: "teachingAssignments.subjectId",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      { $unwind: { path: "$subjectInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          assignmentId: "$teachingAssignments.assignmentId",
          classId: "$_id",
          className: "$name",
          subjectId: "$teachingAssignments.subjectId",
          subjectName: "$subjectInfo.name",
        },
      },
      { $sort: { className: 1, subjectName: 1 } }
    );

    const assignments = await classesCollection
      .aggregate<TeacherAssignment>(aggregationPipeline)
      .toArray();

    return res.status(200).json({
      message: "Incarichi recuperati con successo.",
      assignments: assignments,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero degli incarichi del docente:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero degli incarichi.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
