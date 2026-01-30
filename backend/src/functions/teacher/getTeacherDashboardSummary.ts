import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

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

  const { subjectId } = JSON.parse(req.body || "{}");
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({ message: "ID della materia obbligatorio." });
  }
  const subjectObjectId = new ObjectId(subjectId);
  const teacherId = user._id;

  try {
    const db = (await mongoClient()).db(DB_NAME);

    // --- CONTEGGI FILTRATI PER MATERIA (LOGICA CORRETTA) ---

    // 1. Classi Attive: conta le classi in cui insegni QUESTA materia.
    const activeClassesCount = await db.collection("classes").countDocuments({
      "teachingAssignments.teacherId": teacherId,
      "teachingAssignments.subjectId": subjectObjectId,
    });

    // 2. Test Pubblicati: conta i test di QUESTA materia.
    const publishedTestsCount = await db.collection("tests").countDocuments({
      subjectId: subjectObjectId,
      status: "published",
    });

    // 3. Materiali Caricati: conta i materiali di QUESTA materia.
    const totalMaterialsCount = await db
      .collection("materials")
      .countDocuments({
        subjectId: subjectObjectId,
      });

    // 4. Consegne da Valutare: conta le consegne per i test di QUESTA materia.
    const testsForSubject = await db
      .collection("tests")
      .find({ subjectId: subjectObjectId })
      .project({ _id: 1 })
      .toArray();
    const testIdsForSubject = testsForSubject.map((t) => t._id);

    let pendingSubmissionsCount = 0;
    if (testIdsForSubject.length > 0) {
      const assignments = await db
        .collection("testAssignments")
        .find({
          teacherId: teacherId,
          testId: { $in: testIdsForSubject },
        })
        .project({ _id: 1 })
        .toArray();
      const assignmentIds = assignments.map((a) => a._id);

      if (assignmentIds.length > 0) {
        pendingSubmissionsCount = await db
          .collection("testsubmissions")
          .countDocuments({
            assignmentId: { $in: assignmentIds },
            status: {
              $in: ["submitted", "partially-graded", "ai-grading-in-progress"],
            },
          });
      }
    }

    return res.status(200).json({
      totalMaterialsCount,
      activeClassesCount,
      publishedTestsCount,
      pendingSubmissionsCount,
    });
  } catch (error) {
    console.error("Errore recupero riepilogo dashboard:", error);
    return res.status(500).json({ message: "Errore del server." });
  }
};
