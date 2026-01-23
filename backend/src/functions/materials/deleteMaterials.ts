import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { AWS_REGION, DB_NAME } from "../../_helpers/config/env";
import { ObjectId, Db } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { MaterialDocument } from "./createMaterialWithFiles";

const s3Client = new S3Client({ region: AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

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

  const { materialId } = JSON.parse(req.body || "{}");
  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID Materiale mancante o non valido." });
  }

  const materialObjectId = new ObjectId(materialId);

  try {
    if (!BUCKET_NAME) {
      throw new Error("Nome del bucket S3 non configurato.");
    }

    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection<MaterialDocument>("materials");
    const conversationsCollection = db.collection("aiconversations");
    const chunksCollection = db.collection("document_chunks");

    const materialToDelete = await materialsCollection.findOne({
      _id: materialObjectId,
    });

    if (!materialToDelete) {
      return res.status(404).json({ message: "Materiale non trovato." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      // Un admin può eliminare se il materiale appartiene a una delle sue organizzazioni
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(materialToDelete.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      // Un docente può eliminare solo se è il creatore originale
      isAuthorized = materialToDelete.teacherId?.equals(user._id) || false;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a eliminare questo materiale." });
    }

    const filePathsToDelete: string[] = (materialToDelete.files || [])
      .map((file: any) => file.storagePath)
      .filter((path: string): path is string => !!path);

    const deletionPromises: Promise<any>[] = [];

    if (filePathsToDelete.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: filePathsToDelete.map((path) => ({ Key: path })),
          Quiet: true,
        },
      });
      deletionPromises.push(s3Client.send(deleteCommand));
    }

    deletionPromises.push(
      chunksCollection.deleteMany({ materialId: materialObjectId })
    );
    deletionPromises.push(
      conversationsCollection.deleteMany({ materialIds: materialObjectId })
    );
    deletionPromises.push(
      materialsCollection.deleteOne({ _id: materialObjectId })
    );

    await Promise.all(deletionPromises);

    return res.status(200).json({
      message: "Materiale e tutte le risorse associate sono stati eliminati.",
    });
  } catch (error: any) {
    console.error("Errore durante l'eliminazione del materiale:", error);
    return res.status(500).json({
      message: "Errore del server durante l'eliminazione del materiale.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
