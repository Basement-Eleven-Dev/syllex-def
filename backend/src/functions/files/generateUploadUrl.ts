import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { AWS_REGION } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

// Inizializziamo il client S3 una sola volta per riutilizzarlo
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3Client = new S3Client({ region: AWS_REGION });

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  if (!BUCKET_NAME) {
    console.error(
      "Variabile d'ambiente BUCKET_NAME non configurata o non disponibile!"
    );
    return res
      .status(500)
      .json({ message: "Configurazione del server incompleta." });
  }
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  // 1. Leggiamo i dati del file dal corpo della richiesta
  const body = req.body ? JSON.parse(req.body) : {};
  const { fileName, contentType } = body;

  if (!fileName || !contentType) {
    return res
      .status(400)
      .json({ message: "fileName e contentType sono obbligatori." });
  }

  // 2. Creiamo un percorso unico e sicuro per il file su S3
  const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const storagePath = `materials_uploads/${user._id.toString()}/${uniqueFileName}`;

  // 3. Creiamo il comando per l'upload
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storagePath,
    ContentType: contentType,
  });

  try {
    // 4. Generiamo l'URL pre-firmato valido per 5 minuti
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // 5. Restituiamo l'URL e il percorso al frontend
    return res.status(200).json({
      uploadUrl: uploadUrl,
      storagePath: storagePath,
    });
  } catch (error) {
    console.error("Errore durante la generazione dell'URL pre-firmato:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione del permesso di upload.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
