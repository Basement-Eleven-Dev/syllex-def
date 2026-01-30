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

  const { subjectId } = JSON.parse(req.body || "{}");

  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res
      .status(400)
      .json({ message: "ID della materia non valido o mancante." });
  }

  const subjectObjectId = new ObjectId(subjectId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    const testsWithAssignments = await db
      .collection("tests")
      .aggregate([
        // 1. Trova i test della materia selezionata
        { $match: { subjectId: subjectObjectId } },

        // 2. Unisci (lookup) tutte le assegnazioni collegate a questi test
        {
          $lookup: {
            from: "testAssignments",
            localField: "_id",
            foreignField: "testId",
            as: "assignments",
          },
        },

        // 3. Unisci (lookup) i dettagli delle classi per ottenere i nomi
        {
          $lookup: {
            from: "classes",
            localField: "assignments.classId",
            foreignField: "_id",
            as: "classDetails",
          },
        },

        // 4. Formatta l'output finale in modo pulito
        {
          $project: {
            // Includi tutti i campi originali del test
            title: 1,
            description: 1,
            subjectId: 1,
            organizationId: 1,
            questions: 1,
            status: 1,
            totalPoints: 1,
            createdAt: 1,
            updatedAt: 1,

            // Crea il nuovo array "assignments" con i dati arricchiti
            assignments: {
              $map: {
                input: "$assignments",
                as: "assign",
                in: {
                  _id: "$$assign._id",
                  classId: "$$assign.classId",
                  // Trova il nome della classe corrispondente
                  className: {
                    $let: {
                      vars: {
                        classDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$classDetails",
                                cond: {
                                  $eq: ["$$this._id", "$$assign.classId"],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$classDoc.name",
                    },
                  },
                  availableFrom: "$$assign.availableFrom",
                  availableUntil: "$$assign.availableUntil",
                  durationMinutes: "$$assign.durationMinutes",
                  hasPassword: { $toBool: "$$assign.passwordHash" },
                },
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    const finalResult = testsWithAssignments.map((t) => ({
      ...t,
      assignmentCount: t.assignments ? t.assignments.length : 0,
    }));

    return res.status(200).json({
      message: "Test recuperati con successo.",
      teacherTests: finalResult,
    });
  } catch (error) {
    console.error("Errore durante il recupero dei test del docente:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero dei test.",
    });
  }
};
