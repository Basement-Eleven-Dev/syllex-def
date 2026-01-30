import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
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
  const callingUser = await getCurrentUser(req);
  if (!callingUser) {
    return res
      .status(401)
      .json({ message: "Accesso negato: Utente non autenticato." });
  }

  const { submissionId } = JSON.parse(req.body || "{}");

  if (!submissionId || !ObjectId.isValid(submissionId)) {
    return res
      .status(400)
      .json({ message: "ID Svolgimento non valido o mancante." });
  }
  const submissionObjectId = new ObjectId(submissionId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const submissionsCollection = db.collection("testsubmissions");
    const classesCollection = db.collection("classes");

    // Pipeline con preserveNullAndEmptyArrays: true
    const aggregationPipeline = [
      { $match: { _id: submissionObjectId } },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testId",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentId",
        },
      },
      // IMPORTANTE: preserveNullAndEmptyArrays: true permette al documento di esistere
      // anche se i lookup non trovano nulla
      { $unwind: { path: "$testId", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$studentId", preserveNullAndEmptyArrays: true } },
    ];

    const results = await submissionsCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (!results || results.length === 0) {
      // Se proprio non trova nulla, proviamo una query semplice per debug
      const simpleFind = await submissionsCollection.findOne({
        _id: submissionObjectId,
      });

      if (simpleFind) {
        console.log("📄 Raw document:", JSON.stringify(simpleFind, null, 2));
      }
      return res.status(404).json({ message: "Svolgimento test non trovato." });
    }

    const submission = results[0];

    // Controlli preliminari per dati corrotti
    if (!submission.studentId || !submission.studentId._id) {
      return res
        .status(404)
        .json({
          message: "Dati dello svolgimento corrotti: studentId mancante.",
        });
    }

    if (!submission.testId || !submission.testId._id) {
      return res
        .status(404)
        .json({ message: "Dati dello svolgimento corrotti: testId mancante." });
    }

    if (!submission.classId) {
      return res
        .status(404)
        .json({
          message: "Dati dello svolgimento corrotti: classId mancante.",
        });
    }

    // Logica di autorizzazione
    let isAuthorized = false;

    if (callingUser.role === "student") {
      isAuthorized = submission.studentId._id.equals(callingUser._id);
    } else {
      const targetClass = await classesCollection.findOne({
        _id: submission.classId,
      });
      if (targetClass) {
        if (callingUser.role === "teacher") {
          isAuthorized =
            targetClass.teachingAssignments?.some(
              (a: any) =>
                a.teacherId.equals(callingUser._id) &&
                a.subjectId.equals(submission.testId.subjectId)
            ) || false;
        } else if (callingUser.role === "admin") {
          isAuthorized =
            callingUser.organizationIds?.some((id) =>
              id.equals(targetClass.organizationId)
            ) || false;
        }
      } else {
        console.log("❌ Target class not found");
      }
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({
          message: "Non sei autorizzato a visualizzare questo svolgimento.",
        });
    }

    // Pulizia dati sensibili per studenti
    if (callingUser.role === "student" && submission.status !== "graded") {
      submission.testId?.questions?.forEach((q: any) => {
        delete q.correctAnswer;
        delete q.explanation;
      });
    }

    return res.status(200).json({ submission });
  } catch (error: any) {
    console.error("❌ Errore recupero submission:", error);
    return res.status(500).json({
      message: "Errore del server.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
