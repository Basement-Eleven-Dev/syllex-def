import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Class } from "./createClass";

/**
 * Funzione Lambda per recuperare i dettagli completi di una singola classe.
 * I permessi di accesso vengono controllati in base al ruolo dell'utente.
 */
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

  const { classId } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    // 1. Troviamo la classe per poter verificare i permessi
    const targetClass = await classesCollection.findOne({ _id: classObjectId });
    if (!targetClass) {
      return res.status(404).json({ message: "Classe non trovata." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(targetClass.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      isAuthorized =
        targetClass.teachingAssignments?.some((a) =>
          a.teacherId.equals(user._id)
        ) || false;
    } else if (user.role === "student") {
      isAuthorized =
        targetClass.studentIds?.some((id) => id.equals(user._id)) || false;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a visualizzare i dettagli di questa classe.",
      });
    }

    const aggregationPipeline = [
      { $match: { _id: classObjectId } },
      {
        $lookup: {
          from: "users",
          localField: "studentIds",
          foreignField: "_id",
          as: "studentDetails", // Popoliamo in un campo separato
          pipeline: [{ $project: { firstName: 1, lastName: 1, username: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$teachingAssignments",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "teachingAssignments.subjectId",
          foreignField: "_id",
          as: "teachingAssignments.subjectDetails",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "teachingAssignments.teacherId",
          foreignField: "_id",
          as: "teachingAssignments.teacherDetails",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$teachingAssignments.subjectDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$teachingAssignments.teacherDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          teachingAssignments: { $push: "$teachingAssignments" },
        },
      },

      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$doc",

              {
                teachingAssignments: "$teachingAssignments",
                studentDetails: "$doc.studentDetails", // Manteniamo i dettagli in un campo separato
              },
            ],
          },
        },
      },
      // --- FINE MODIFICA ---
    ];

    const populatedResult = await classesCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (populatedResult.length === 0) {
      return res.status(404).json({
        message: "Classe non trovata durante la fase di popolamento.",
      });
    }

    const finalClass = populatedResult[0];

    return res.status(200).json({
      message: "Dettagli classe recuperati con successo.",
      class: finalClass,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero dei dettagli della classe:",
      error
    );
    return res.status(500).json({
      message:
        "Errore del server durante il recupero dei dettagli della classe.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
