import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../../_helpers/getDatabase";
import { DB_NAME } from "../../../_helpers/config/env";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";

export interface Course {
  _id?: ObjectId;
  name: string;
  organizationId: ObjectId;
  subjectIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

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

  const body = req.body ? JSON.parse(req.body) : {};
  const { name, organizationId } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      message: "Il nome del corso è obbligatorio",
    });
  }
  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res
      .status(400)
      .json({ message: "Id organizzazione invalido o mancante" });
  }

  const orgObjectId = new ObjectId(organizationId);

  // Un admin può creare un corso solo in un'organizzazione che gestisce.
  if (!user.organizationIds?.some((id) => id.equals(orgObjectId))) {
    return res.status(403).json({
      message: "Non sei autorizzato a creare corsi per questa organizzazione.",
    });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const coursesCollection = db.collection("courses");
    const organizationsCollection = db.collection("organizations");

    const newCourseDoc: Omit<Course, "_id"> = {
      name: name.trim(),
      organizationId: orgObjectId,
      subjectIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await coursesCollection.insertOne(newCourseDoc as any);
    const newCourseId = result.insertedId;

    await organizationsCollection.updateOne(
      { _id: orgObjectId },
      { $addToSet: { course: newCourseId } }
    );

    const insertedCourse = {
      ...newCourseDoc,
      _id: newCourseId,
    };

    return res.status(200).json({
      message: "corso creato con successo",
      course: insertedCourse,
    });
  } catch (error) {
    console.error("Errore durante la creazione del corso:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione del corso.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
