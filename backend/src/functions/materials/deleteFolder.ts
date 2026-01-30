import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { AWS_REGION, DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { Folder } from "./createFolder";

const s3Client = new S3Client({ region: AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

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

  const { folderId, subjectId } = JSON.parse(req.body || "{}");
  if (!folderId || !ObjectId.isValid(folderId)) {
    return res
      .status(400)
      .json({ message: "ID della cartella non valido o mancante." });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res
      .status(400)
      .json({ message: "ID della materia non valido o mancante." });
  }

  const folderObjectId = new ObjectId(folderId);
  const subjectObjectId = new ObjectId(subjectId);

  try {
    if (!BUCKET_NAME) {
      throw new Error("Nome del bucket S3 non configurato.");
    }
    const db: Db = (await mongoClient()).db(DB_NAME);
    const foldersCollection = db.collection<Folder>("folders");
    const materialsCollection = db.collection("materials");
    const chunksCollection = db.collection("document_chunks");
    const conversationsCollection = db.collection("aiconversations");
    const classesCollection = db.collection("classes");
    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": subjectObjectId,
    });
    if (assignmentCount === 0) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questa materia." });
    }

    const foldersToDeleteIds: ObjectId[] = [folderObjectId];
    const foldersToScan: ObjectId[] = [folderObjectId];

    while (foldersToScan.length > 0) {
      const currentId = foldersToScan.pop()!;
      const subfolders = await foldersCollection
        .find({ parentId: currentId, subjectId: subjectObjectId })
        .toArray();
      for (const subfolder of subfolders) {
        foldersToDeleteIds.push(subfolder._id);
        foldersToScan.push(subfolder._id);
      }
    }

    //trova tutti i materiali contenuti in queste cartelle
    const materialsToDelete = await materialsCollection
      .find({
        folderId: { $in: foldersToDeleteIds },
        subjectId: subjectObjectId,
      })
      .toArray();

    const materialIdsToDelete = materialsToDelete.map((m) => m._id);

    const filePathsToDelete: string[] = materialsToDelete
      .flatMap((material) =>
        (material.files || []).map((file: any) => file.storagePath)
      )
      .filter((path): path is string => !!path);

    //elimina tutto in parallelo
    const deletePromises: Promise<any>[] = [];

    if (filePathsToDelete.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: filePathsToDelete.map((path) => ({ Key: path })),
          Quiet: true, // Non ci serve una risposta dettagliata per ogni file
        },
      });
      deletePromises.push(s3Client.send(deleteCommand));
    }

    if (materialIdsToDelete.length > 0) {
      deletePromises.push(
        materialsCollection.deleteMany({ _id: { $in: materialIdsToDelete } })
      );
      deletePromises.push(
        chunksCollection.deleteMany({
          materialId: { $in: materialIdsToDelete },
        })
      );
      deletePromises.push(
        conversationsCollection.deleteMany({
          materialIds: { $in: materialIdsToDelete },
        })
      );
    }

    deletePromises.push(
      foldersCollection.deleteMany({ _id: { $in: foldersToDeleteIds } })
    );

    await Promise.all(deletePromises);

    return res.status(200).json({
      message: `Cartella e tutto il suo contenuto eliminati con successo.`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore del server durante l'eliminazione della cartella.",
    });
  }
};
