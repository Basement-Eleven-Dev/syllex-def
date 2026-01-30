import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

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

  const teacherId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    const results = await db
      .collection("classes")
      .aggregate([
        // Fase 1: Trova tutte le classi in cui il docente ha almeno un incarico
        {
          $match: { "teachingAssignments.teacherId": teacherId },
        },
        // Fase 2: Unisci i dettagli del corso per ottenere il nome
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        // Semplifica la struttura se il corso è stato trovato
        { $unwind: "$courseInfo" },
        // Fase 3: Raggruppa per corso
        {
          $group: {
            _id: "$courseId", // Raggruppa per ID del corso
            courseName: { $first: "$courseInfo.name" }, // Prendi il nome del corso (sarà sempre lo stesso)
            // Crea un array con tutte le classi che appartengono a questo corso
            classes: {
              $addToSet: {
                // $addToSet per evitare duplicati se un docente ha più incarichi nella stessa classe
                classId: "$_id",
                className: "$name",
              },
            },
          },
        },
        // Fase 4: Formatta l'output finale
        {
          $project: {
            _id: 0,
            courseId: "$_id",
            courseName: 1,
            classes: 1,
          },
        },
        // Fase 5: Ordina i corsi alfabeticamente
        {
          $sort: { courseName: 1 },
        },
      ])
      .toArray();

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error("Errore recupero corsi e classi per docente:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero dei dati.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
