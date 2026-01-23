// in getMaterialDownloadLink.ts

import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { AWS_REGION, DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);

  if (!user) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { materialId, storagePath } = JSON.parse(req.body || "{}");

  if (!materialId || !ObjectId.isValid(materialId) || !storagePath) {
    return res
      .status(400)
      .json({ message: "ID materiale o percorso file mancante." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection("materials");
    const classesCollection = db.collection("classes");
    const materialObjectId = new ObjectId(materialId);

    // ✅ **FIX 1: AUTORIZZAZIONE CORRETTA PER LO STUDENTE**
    // Verifichiamo che lo studente sia in una classe dove il materiale è assegnato
    let isAuthorized = false;
    if (user.role === "teacher") {
      // Un docente può scaricare il proprio materiale
      const material = await materialsCollection.findOne({
        _id: materialObjectId,
        teacherId: user._id,
      });
      if (material) isAuthorized = true;
    } else if (user.role === "student") {
      const authorizedClass = await classesCollection.findOne({
        studentIds: user._id,
        "teachingAssignments.assignedMaterialIds": materialObjectId,
      });
      if (authorizedClass) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a scaricare questo materiale." });
    }

    // Ora che l'autorizzazione è confermata, recuperiamo i dettagli del materiale
    const material = await materialsCollection.findOne({
      _id: materialObjectId,
    });
    if (!material) {
      return res.status(404).json({ message: "Materiale non trovato." });
    }

    const fileInfo = material.files.find(
      (f: any) => f.storagePath === storagePath
    );
    if (!fileInfo) {
      return res
        .status(404)
        .json({ message: "File non trovato nel materiale." });
    }

    if (!BUCKET_NAME) {
      throw new Error("Nome del bucket S3 non configurato.");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
      ResponseContentDisposition: `attachment; filename="${fileInfo.originalName}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // L'URL è valido per 5 minuti
    });

    return res.status(200).json({ downloadUrl: downloadUrl });
  } catch (error: any) {
    console.error("Errore durante la generazione del link di download:", error);
    return res.status(500).json({
      message: "Errore del server durante la generazione del link di download.",
      error: error.message,
    });
  }
};
