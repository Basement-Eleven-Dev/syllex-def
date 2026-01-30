import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME, AWS_REGION } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mammoth from "mammoth";

const s3Client = new S3Client({ region: AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

// Definiamo un tipo per la nostra nuova risposta strutturata
interface MaterialContentResponse {
  type: "url" | "html" | "markdown" | "text";
  content: string;
  originalFileName?: string;
}

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

  const { materialId } = JSON.parse(req.body || "{}");

  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "È necessario fornire un 'materialId' valido." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection("materials");

    // Logica di autorizzazione potenziata
    let material;
    if (user.role === "teacher") {
      material = await materialsCollection.findOne({
        _id: new ObjectId(materialId),
        teacherId: user._id,
      });
    } else {
      // Studente: La logica di autorizzazione deve verificare che lo studente
      // sia in una classe dove il materiale è assegnato a un incarico.
      const classesCollection = db.collection("classes");
      const materialObjectId = new ObjectId(materialId);

      // Cerchiamo una classe che soddisfi ENTRAMBE le condizioni:
      // 1. Lo studente è iscritto (studentIds contiene user._id)
      // 2. Il materiale è presente in almeno uno degli incarichi della classe
      const authorizedClass = await classesCollection.findOne({
        studentIds: user._id,
        "teachingAssignments.assignedMaterialIds": materialObjectId,
      });

      // Se troviamo una classe, lo studente è autorizzato a vedere il materiale.
      if (authorizedClass) {
        material = await materialsCollection.findOne({
          _id: materialObjectId,
        });
      }
    }

    if (!material) {
      return res
        .status(404)
        .json({ message: "Materiale non trovato o non autorizzato." });
    }

    const responsePayload: Partial<MaterialContentResponse> = {};

    // Caso 1: Materiale generato dall'AI (Markdown)
    if (material.generatedContent) {
      responsePayload.type = "markdown";
      responsePayload.content = material.generatedContent;
      responsePayload.originalFileName = `${material.title}.md`;
    }
    // Caso 2: Materiale caricato (PDF, DOCX, Immagini, PPTX, etc.)
    else if (material.files && material.files.length > 0) {
      const fileToRead = material.files[0];
      const { storagePath, mimetype, originalName } = fileToRead;

      if (!BUCKET_NAME) throw new Error("Nome del bucket S3 non configurato.");

      // Per PDF, Immagini e Presentazioni, generiamo un URL sicuro per la visualizzazione diretta
      if (
        mimetype.includes("pdf") ||
        mimetype.startsWith("image/") ||
        mimetype.includes("presentation") ||
        mimetype.includes("powerpoint") ||
        mimetype.includes("spreadsheetml.sheet") || // .xlsx
        mimetype.includes("ms-excel") // .xls
      ) {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storagePath,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 300,
        }); // Valido 5 minuti

        responsePayload.type = "url";
        responsePayload.content = signedUrl;
        responsePayload.originalFileName = originalName;
      }
      // Per i documenti Word, li convertiamo in HTML per preservare la formattazione
      else if (mimetype.includes("wordprocessingml")) {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storagePath,
        });
        const { Body } = await s3Client.send(command);
        if (!Body) throw new Error("Corpo del file vuoto da S3.");
        const fileBuffer = Buffer.from(
          await (Body as any).transformToByteArray()
        );

        const result = await mammoth.convertToHtml({ buffer: fileBuffer });

        responsePayload.type = "html";
        responsePayload.content = result.value; // Il contenuto è l'HTML generato
        responsePayload.originalFileName = originalName;
      }
      // Per tutto il resto, restituiamo il testo grezzo come fallback
      else {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storagePath,
        });
        const { Body } = await s3Client.send(command);
        if (!Body) throw new Error("Corpo del file vuoto da S3.");
        const fileBuffer = Buffer.from(
          await (Body as any).transformToByteArray()
        );

        responsePayload.type = "text";
        responsePayload.content = fileBuffer.toString("utf-8");
        responsePayload.originalFileName = originalName;
      }
    }
    // Caso 3: Nessun contenuto
    else {
      return res.status(404).json({
        message: "Nessun contenuto o file associato a questo materiale.",
      });
    }

    return res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error("[GetMaterialContent] Errore:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero del contenuto.",
      error: error.message,
    });
  }
};
