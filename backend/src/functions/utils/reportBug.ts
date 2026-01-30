import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_REGION } from "../../_helpers/config/env";

const EMAIL_MITTENTE_VERIFICATO = "supporto@convivo.studio";
const EMAIL_DESTINATARIO_VERIFICATO = "riccardo@convivostudio.it";

const sesClient = new SESClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(403).json({ message: "Accesso negato" });
    }

    const {
      description,
      logs,
      s3ImageKeys = [],
    } = JSON.parse(req.body || "{}");

    if (!description) {
      return res
        .status(400)
        .json({ message: "La descrizione del bug è obbligatoria" });
    }

    const bucketName = process.env.BUCKET_NAME;

    // Genera URL pre-firmati per ogni immagine (validi per 7 giorni)
    const imagePreviewsPromises = s3ImageKeys.map(async (key: string) => {
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        // URL pre-firmato valido per 7 giorni
        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 604800,
        });

        // Creiamo un blocco HTML per ogni immagine
        return `
          <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
            <p style="font-size: 14px; margin: 0 0 10px 0; word-break: break-all;">
              <a href="${presignedUrl}" target="_blank" style="text-decoration: none; color: #007bff; font-weight: bold;">
                ${key}
              </a>
            </p>
            <a href="${presignedUrl}" target="_blank">
              <img 
                src="${presignedUrl}" 
                alt="Anteprima allegato bug" 
                style="width: 100%; max-width: 500px; height: auto; border-radius: 4px; border: 1px solid #ccc;"
              />
            </a>
          </div>
        `;
      } catch (error) {
        console.error(`Errore generando URL per ${key}:`, error);
        return `<div style="...">${key} (errore generando anteprima)</div>`;
      }
    });

    const imagePreviewsArray =
      s3ImageKeys.length > 0
        ? await Promise.all(imagePreviewsPromises)
        : [
          '<p style="font-style: italic; color: #555;">Nessuna immagine fornita.</p>',
        ];

    const imagePreviews = imagePreviewsArray.join("");

    const emailBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      
      <div style="background-color: #f4f4f4; padding: 20px; border-bottom: 1px solid #ddd;">
        <h1 style="margin: 0; font-size: 24px; color: #d9534f; text-align: center;">
          Nuova Segnalazione Bug
        </h1>
      </div>
      
      <div style="padding: 25px;">
        
        <h2 style="font-size: 18px; color: #333; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 5px;">Riepilogo Segnalazione</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #fcfcfc; width: 150px;">Utente:</td>
              <td style="padding: 10px;">${user.username}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 10px; font-weight: bold; background-color: #fcfcfc;">ID Utente:</td>
              <td style="padding: 10px;">${user._id.toString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; background-color: #fcfcfc;">Quando:</td>
              <td style="padding: 10px;">${new Date().toLocaleString(
      "it-IT"
    )}</td>
            </tr>
          </tbody>
        </table>

        <h2 style="font-size: 18px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Descrizione Malfunzionamento</h2>
        <div style="background-color: #fdfdfd; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 25px; white-space: pre-wrap; word-wrap: break-word;">
          ${description}
        </div>

        <h2 style="font-size: 18px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Logs / Passaggi per Riprodurre</h2>
        <div style="background-color: #fdfdfd; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 25px; white-space: pre-wrap; word-wrap: break-word;">
          ${logs || "Nessun log fornito."}
        </div>

        <h2 style="font-size: 18px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Allegati</h2>
        ${imagePreviews}
        
      </div>

      <div style="background-color: #f4f4f4; padding: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          <em>Nota: I link e le anteprime degli allegati sono validi per 7 giorni.</em>
        </p>
      </div>
    </div>
  `;

    const sendEmailCommand = new SendEmailCommand({
      Source: EMAIL_MITTENTE_VERIFICATO,
      Destination: {
        ToAddresses: [EMAIL_DESTINATARIO_VERIFICATO],
      },
      Message: {
        Subject: {
          Data: "Nuova Segnalazione Bug Syllex",
        },
        Body: {
          Html: {
            Data: emailBody,
          },
        },
      },
    });

    await sesClient.send(sendEmailCommand);

    console.log(`Segnalazione bug inviata da ${user.username}`);
    return res
      .status(200)
      .json({ message: "Segnalazione inviata con successo. Grazie!" });
  } catch (error) {
    console.error("Errore durante l'invio della segnalazione bug:", error);
    return res.status(500).json({
      message: "Errore del server durante l'invio della segnalazione.",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });
  }
};
