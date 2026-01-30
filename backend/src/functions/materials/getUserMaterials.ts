import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

/**
 * Funzione Lambda per recuperare tutti i materiali a cui un docente ha accesso
 * in base alle materie che insegna.
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

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");
    const materialsCollection = db.collection("materials");

    // Troviamo tutti gli incarichi del docente per capire quali materie insegna
    const assignments = await classesCollection
      .aggregate([
        { $match: { "teachingAssignments.teacherId": user._id } },
        { $unwind: "$teachingAssignments" },
        { $match: { "teachingAssignments.teacherId": user._id } },
        { $group: { _id: "$teachingAssignments.subjectId" } },
      ])
      .toArray();

    const subjectIds = assignments.map((a) => a._id);

    if (subjectIds.length === 0) {
      // È un caso normale, il docente potrebbe non avere ancora incarichi
      return res.status(200).json({ materials: [] });
    }

    // 2. Recuperiamo tutti i materiali che appartengono a quelle materie
    const materials = await materialsCollection
      .find({
        subjectId: { $in: subjectIds },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      message: "Materiali recuperati con successo.",
      materials: materials,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero dei materiali del docente:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero dei materiali.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
