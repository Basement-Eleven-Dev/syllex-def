import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { triggerBackgroundTask } from "../../_helpers/_utils/sqs.utils";
import { performIndexing } from "../../background/indexMaterial";

export interface MaterialFileDB {
  originalName: string;
  serverFilename: string;
  storagePath: string;
  mimetype: string;
  size: number;
}

export interface MaterialDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  teacherId?: ObjectId; // DA RIMUOVERE: Sostituito dalla logica degli incarichi. Opzionale per ora.
  folderId: ObjectId | null; // MANTENUTO: Organizzazione personale del docente.
  subjectId: ObjectId; // NUOVO: A quale materia appartiene il materiale.
  organizationId: ObjectId; // NUOVO: A quale organizzazione appartiene.
  files: MaterialFileDB[];
  generatedContent?: string;
  topics?: {};
  sharedWithClassIds?: ObjectId[]; // DA RIMUOVERE: Sostituito dagli incarichi e assegnazioni. Opzionale per ora.
  associatedTestIds?: string[];
  generatedFromId?: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  indexingStatus?: "pending" | "in-progress" | "completed" | "failed";
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

  const { title, description, folderId, files, subjectId, organizationId } =
    JSON.parse(req.body || "{}");

  if (!title || !files || !Array.isArray(files) || files.length === 0) {
    return res
      .status(400)
      .json({ message: "Titolo e almeno un file sono obbligatori." });
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

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const cleanedFiles = files.map((fileInfo: any) => fileInfo.fileMetadata);
    const newMaterialDoc: Omit<MaterialDocument, "_id"> = {
      title: title.trim(),
      description: description || "",

      teacherId: user._id,
      folderId:
        folderId && ObjectId.isValid(folderId) ? new ObjectId(folderId) : null,
      sharedWithClassIds: [],

      subjectId: new ObjectId(subjectId),
      organizationId: new ObjectId(organizationId),

      files: cleanedFiles,
      topics: {},
      associatedTestIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      indexingStatus: "pending",
    };

    const result = await db.collection("materials").insertOne(newMaterialDoc);
    const insertedMaterial = {
      ...newMaterialDoc,
      _id: result.insertedId,
    };

    const materialId = result.insertedId.toString();
    await triggerBackgroundTask(
      process.env.INDEXING_QUEUE_URL,
      materialId,
      () => performIndexing(materialId)
    );

    return res.status(201).json({
      message: `materiale creato con successo!`,
      material: insertedMaterial,
    });
  } catch (error) {
    console.error("Errore durante la creazione del materiale:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione del materiale.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
