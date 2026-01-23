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
import { Class } from "../class/createClass";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Accesso negato. Riservato agli studenti." });
  }

  // Per questa funzione specifica, ha senso usare i query params perché si arriva da un link
  const { classId } = req.queryStringParameters || {};

  if (!classId || !ObjectId.isValid(classId)) {
    return res
      .status(400)
      .json({ message: "ID della classe non valido o mancante." });
  }

  const classObjectId = new ObjectId(classId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");

    const targetClass = await classesCollection.findOne({ _id: classObjectId });
    if (!targetClass) {
      return res.status(404).json({ message: "Classe non trovata." });
    }

    if (
      !user.organizationIds?.some((id) => id.equals(targetClass.organizationId))
    ) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a visualizzare i dettagli di questa classe.",
      });
    }

    const aggregationPipeline = [
      { $match: { _id: classObjectId } },
      // Popoliamo il nome del corso
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "courseInfo",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      // Popoliamo il nome dell'organizzazione
      {
        $lookup: {
          from: "organizations",
          localField: "organizationId",
          foreignField: "_id",
          as: "organizationInfo",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      // Popoliamo i docenti
      {
        $unwind: {
          path: "$teachingAssignments",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "teachingAssignments.teacherId",
          foreignField: "_id",
          as: "teacherInfo",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      { $unwind: { path: "$teacherInfo", preserveNullAndEmptyArrays: true } },
      // Raggruppiamo per ricreare l'oggetto classe
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          courseName: { $first: { $arrayElemAt: ["$courseInfo.name", 0] } },
          organizationName: {
            $first: { $arrayElemAt: ["$organizationInfo.name", 0] },
          },
          teachers: {
            $push: {
              $concat: ["$teacherInfo.firstName", " ", "$teacherInfo.lastName"],
            },
          },
        },
      },
    ];

    const result = await classesCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Dettagli della classe non trovati." });
    }

    return res.status(200).json({
      message: "Dettagli classe recuperati con successo.",
      class: result[0],
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero dei dettagli per l'iscrizione:",
      error
    );
    return res.status(500).json({
      message:
        "Errore del server durante il recupero dei dettagli della classe.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
