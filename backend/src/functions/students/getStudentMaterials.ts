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
    return res.status(403).json({ message: "Accesso negato." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection<Class>("classes");
    const materialsCollection = db.collection("materials");

    const enrolledClasses = await classesCollection
      .find({ studentIds: user._id })
      .toArray();
    if (enrolledClasses.length === 0) {
      return res.status(200).json({ materials: [] });
    }

    const assignedMaterialIds = enrolledClasses.flatMap(
      (cls) =>
        cls.teachingAssignments?.flatMap((a) => a.assignedMaterialIds) || []
    );
    const uniqueMaterialIds = [
      ...new Set(assignedMaterialIds.map((id) => id.toString())),
    ].map((id) => new ObjectId(id));

    if (uniqueMaterialIds.length === 0) {
      return res.status(200).json({ materials: [] });
    }

    // Usiamo una pipeline di aggregazione per "popolare" il nome della materia
    const aggregationPipeline = [
      { $match: { _id: { $in: uniqueMaterialIds } } },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subjectInfo",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: "$subjectInfo", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $addFields: { subjectName: "$subjectInfo.name" } },
      { $project: { subjectInfo: 0 } },
    ];

    const materials = await materialsCollection
      .aggregate(aggregationPipeline)
      .toArray();

    return res.status(200).json({
      message: "Materiali recuperati con successo.",
      materials: materials,
    });
  } catch (error) {
    console.error("Errore recupero materiali studente:", error);
    return res.status(500).json({
      message: "Errore del server.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
