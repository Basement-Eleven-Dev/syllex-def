import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../../_helpers/getDatabase";
import { DB_NAME } from "../../../_helpers/config/env";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";
import { Course } from "../courses/createCourse";
import { Subject } from "./createSubject";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { courseId } = JSON.parse(req.body || "{}");

  if (!courseId || !ObjectId.isValid(courseId)) {
    return res
      .status(400)
      .json({ message: "ID del corso non valido o mancante." });
  }

  const courseObjectId = new ObjectId(courseId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const coursesCollection = db.collection<Course>("courses");
    const subjectsCollection = db.collection<Subject>("subjects");

    // 1. Troviamo il corso per ottenere la lista degli ID delle materie
    const course = await coursesCollection.findOne({ _id: courseObjectId });
    if (!course) {
      return res.status(404).json({ message: "Corso non trovato." });
    }
    // Sicurezza: verifichiamo che l'admin possa accedere a questo corso
    if (!user.organizationIds?.some((id) => id.equals(course.organizationId))) {
      return res
        .status(403)
        .json({ message: "Non autorizzato a visualizzare questo corso." });
    }

    if (!course.subjectIds || course.subjectIds.length === 0) {
      return res.status(200).json({ subjects: [] }); // Nessuna materia associata
    }

    // 2. Usiamo gli ID per recuperare i dettagli completi delle materie
    const subjects = await subjectsCollection
      .find({ _id: { $in: course.subjectIds } })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      message: "Materie recuperate con successo.",
      subjects: subjects,
    });
  } catch (error) {
    console.error("Errore durante il recupero delle materie del corso:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle materie.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
