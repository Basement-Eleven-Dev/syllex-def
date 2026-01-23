import { Db, ObjectId } from "mongodb";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export interface Folder {
  _id?: ObjectId;
  name: string;
  teacherId?: ObjectId; // DA RIMUOVERE: Sostituito dalla logica degli incarichi.
  subjectId: ObjectId; // NUOVO: A quale materia appartiene la cartella.
  organizationId: ObjectId; // NUOVO: A quale organizzazione appartiene.
  parentId: ObjectId | null;
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
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { name, parentId, subjectId, organizationId } = JSON.parse(
    req.body || "{}"
  );

  // Validazione aggiornata
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Il nome della cartella è obbligatorio." });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({
      message: "È necessario specificare una materia (subjectId) valida.",
    });
  }
  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      message:
        "È necessario specificare un'organizzazione (organizationId) valida.",
    });
  }

  const subjectObjectId = new ObjectId(subjectId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const folderCollections = db.collection<Folder>("folders");
    const classesCollection = db.collection("classes");

    // Verifichiamo che il docente insegni effettivamente la materia in cui sta creando la cartella
    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": subjectObjectId,
    });

    if (assignmentCount === 0) {
      return res.status(403).json({
        message: "Non sei autorizzato a creare cartelle per questa materia.",
      });
    }

    const newFolderData: Omit<Folder, "_id"> = {
      name: name.trim(),
      teacherId: user._id, // Mantenuto per ora per retrocompatibilità
      parentId: parentId ? new ObjectId(parentId) : null,
      subjectId: subjectObjectId,
      organizationId: new ObjectId(organizationId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await folderCollections.insertOne(newFolderData);
    const savedFolder = await folderCollections.findOne({
      _id: result.insertedId,
    });

    if (!savedFolder) {
      throw new Error(
        "Creazione cartella fallita: inserimento nel DB non riuscito."
      );
    }

    const folderForFrontend = {
      ...savedFolder,
      _id: savedFolder._id.toString(),
      teacherId: savedFolder.teacherId?.toString(),
      parentId: savedFolder.parentId ? savedFolder.parentId.toString() : null,
      subjectId: savedFolder.subjectId.toString(),
      organizationId: savedFolder.organizationId.toString(),
    };

    return res.status(201).json({
      message: `Cartella "${savedFolder.name}" creata con successo!`,
      folder: folderForFrontend,
    });
  } catch (error) {
    console.error("Errore durante la creazione della cartella:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione della cartella.",
    });
  }
};
