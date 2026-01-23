import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db, WithId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

export interface Class {
  _id?: ObjectId;
  name: string;
  description?: string;
  organizationId: ObjectId;
  courseId: ObjectId;
  studentIds: ObjectId[];
  teachingAssignments: {
    assignmentId: ObjectId;
    subjectId: ObjectId;
    teacherId: ObjectId;
    assignedMaterialIds: ObjectId[];
  }[];
  enrollmentCode: string;
  createdAt: Date;
  updatedAt: Date;
}

function generateEnrollmentCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.substring(0, 3)}-${code.substring(3, 6)}`;
}

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

  const { name, description, organizationId, courseId, studentIds } =
    JSON.parse(req.body || "{}");

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Il nome della classe è obbligatorio." });
  }
  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res
      .status(400)
      .json({ message: "ID dell'organizzazione non valido." });
  }
  if (!courseId || !ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "ID del corso non valido." });
  }

  const orgObjectId = new ObjectId(organizationId);
  const courseObjectId = new ObjectId(courseId);
  const studentObjectIds = (Array.isArray(studentIds) ? studentIds : [])
    .filter((id: string) => ObjectId.isValid(id))
    .map((id: string) => new ObjectId(id));

  if (!user.organizationIds?.some((id) => id.equals(orgObjectId))) {
    return res.status(403).json({
      message: "Non sei autorizzato a creare classi per questa organizzazione.",
    });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");
    const coursesCollection = db.collection("courses");

    const course = await coursesCollection.findOne({
      _id: courseObjectId,
      organizationId: orgObjectId,
    });
    if (!course) {
      return res.status(404).json({
        message:
          "Corso non trovato o non appartenente a questa organizzazione.",
      });
    }

    const newClassDoc: Omit<Class, "_id"> = {
      name: name.trim(),
      description: description?.trim() || "",
      organizationId: orgObjectId,
      courseId: courseObjectId,
      studentIds: studentObjectIds,
      teachingAssignments: [],
      enrollmentCode: generateEnrollmentCode(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await classesCollection.insertOne(newClassDoc);

    const insertedClass: WithId<Class> = {
      ...newClassDoc,
      _id: result.insertedId,
    };

    return res.status(201).json({
      message: `Classe "${name}" creata con successo!`,
      class: insertedClass,
    });
  } catch (error) {
    console.error("Errore durante la creazione della classe:", error);
    // Aggiungiamo un controllo per i codici duplicati, anche se molto improbabile
    if (error instanceof Error && (error as any).code === 11000) {
      return res.status(409).json({
        message:
          "Conflitto: il codice di iscrizione generato esiste già. Riprova.",
      });
    }
    return res.status(500).json({
      message: "Errore del server durante la creazione della classe.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
