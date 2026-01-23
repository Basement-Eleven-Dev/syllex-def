import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");

    const enrolledClasses = await classesCollection
      .aggregate([
        // Fase 1: Trova tutte le classi a cui lo studente è iscritto
        { $match: { studentIds: user._id } },

        // Fase 2: Raccogli tutti gli ID unici dei docenti dall'array "teachingAssignments"
        {
          $lookup: {
            from: "users", // Cerca nella collezione degli utenti
            localField: "teachingAssignments.teacherId", // Usa gli ID dei docenti
            foreignField: "_id",
            as: "teachers", // Metti i risultati in un nuovo array chiamato "teachers"
          },
        },

        // Fase 3: Pulisci l'output, selezionando solo i campi necessari
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            studentIds: 1,
            courseId: 1,
            // Formatta l'array dei docenti per restituire solo nome e cognome
            teachers: {
              $map: {
                input: "$teachers",
                as: "teacher",
                in: {
                  _id: "$$teacher._id",
                  firstName: "$$teacher.firstName",
                  lastName: "$$teacher.lastName",
                },
              },
            },
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      classes: enrolledClasses,
    });
  } catch (error) {
    console.error("Errore recupero classi per studente:", error);
    return res.status(500).json({
      message: "Errore server recupero dati.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
