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
import { Class } from "./createClass";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      message: "Accesso negato. Funzionalità riservata agli amministratori.",
    });
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
    const classesCollection = db.collection<Class>("classes");
    const coursesCollection = db.collection("courses");

    const course = await coursesCollection.findOne({ _id: courseObjectId });
    if (!course) {
      return res.status(404).json({ message: "Corso non trovato." });
    }
    if (!user.organizationIds?.some((id) => id.equals(course.organizationId))) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a visualizzare questo corso." });
    }

    const classes = await classesCollection
      .find({
        courseId: courseObjectId,
      })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      message: "Classi recuperate con successo.",
      classes: classes,
    });
  } catch (error) {
    console.error("Errore durante il recupero delle classi del corso:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle classi.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
