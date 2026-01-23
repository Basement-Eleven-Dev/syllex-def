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

export interface Subject {
  _id?: ObjectId;
  name: string;
  organizationId: ObjectId;
  materialIds: ObjectId[];
  testIds: ObjectId[];
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
    return res.status(400).json({ message: "Accesso negato" });
  }

  const body = req.body ? JSON.parse(req.body) : {};
  const { name, courseId } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Il nome della materia è obbligatorio." });
  }
  if (!courseId || !ObjectId.isValid(courseId)) {
    return res
      .status(400)
      .json({ message: "ID del corso non valido o mancante." });
  }

  const courseObjectId = new ObjectId(courseId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const subjectsCollection = db.collection("subjects");
    const coursesCollection = db.collection("courses");

    const course = await coursesCollection.findOne({ _id: courseObjectId });
    if (!course) {
      return res.status(400).json({ message: "Corso non trovato" });
    }
    if (!user.organizationIds?.some((id) => id.equals(course.organizationId))) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questo corso" });
    }

    const newSubjectDoc: Omit<Subject, "_id"> = {
      name: name.trim(),
      organizationId: course.organizationId,
      materialIds: [],
      testIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await subjectsCollection.insertOne(newSubjectDoc as any);
    const newSubjecId = result.insertedId;

    await coursesCollection.updateOne(
      {
        _id: courseObjectId,
      },
      {
        $addToSet: { subjectIds: newSubjecId },
      }
    );
    const insertedSubject = {
      ...newSubjectDoc,
      _id: newSubjecId,
    };

    return res.status(201).json({
      message: "Materia creata con successo",
      subject: insertedSubject,
    });
  } catch (error) {
    console.error("Errore durante la creazione della materia:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione della materia.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
