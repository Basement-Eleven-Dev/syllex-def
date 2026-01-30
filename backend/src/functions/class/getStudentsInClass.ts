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

  if (!user || !["admin", "teacher"].includes(user.role)) {
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
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a visualizzare gli studenti di questa classe.",
      });
    }

    if (!targetClass.studentIds || targetClass.studentIds.length === 0) {
      return res.status(200).json({ students: [] }); // Nessuno studente iscritto
    }

    const students = await db
      .collection("users")
      .find({
        _id: { $in: targetClass.studentIds },
      })
      .project({
        _id: 1,
        firstName: 1,
        lastName: 1,
        username: 1,
      })
      .toArray();

    return res.status(200).json({ students });
  } catch (error) {
    console.error(
      "Errore durante il recupero degli studenti della classe:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero degli studenti.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
