import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { sendEmail } from "./sendEmail";

const sqsClient = new SQSClient();

const CHUNK_SIZE = 50; // Massimo 50 destinatari per messaggio SQS

/**
 * Parametri per l'invio bulk di email tramite SQS.
 * L'HTML viene generato nel codice e inviato direttamente (no SES templates).
 */
export interface BulkEmailParams {
  /** Oggetto dell'email */
  subject: string;
  /** Corpo HTML dell'email */
  html: string;
  /** Lista di indirizzi email dei destinatari */
  recipients: string[];
}

/**
 * Divide un array in chunk di dimensione specificata
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Invia email in bulk tramite SQS.
 * Divide automaticamente i destinatari in chunk da 50 e invia ogni chunk
 * come messaggio separato alla coda SQS per l'elaborazione asincrona.
 *
 * Esempio d'uso:
 * ```ts
 * await sendBulkEmail({
 *   subject: "Nuova comunicazione",
 *   html: "<h1>Ciao {{nome}}</h1><p>Nuovo avviso...</p>",
 *   recipients: ["studente1@email.com", "studente2@email.com"]
 * });
 * ```
 *
 * @returns Il numero di messaggi SQS inviati
 */
export async function sendBulkEmail(
  params: BulkEmailParams
): Promise<number> {
  const queueUrl = process.env.EMAIL_QUEUE_URL;

  const { subject, html, recipients } = params;

  console.log("[EmailQueue] Invio email a:", recipients);

  if (recipients.length === 0) {
    console.log("[EmailQueue] Nessun destinatario specificato, skip.");
    return 0;
  }

  // Fallback locale: se EMAIL_QUEUE_URL non è configurata (sviluppo locale),
  // invia le email direttamente senza passare per SQS.
  // In produzione, CDK inietta EMAIL_QUEUE_URL automaticamente → usa SQS.
  if (!queueUrl) {
    console.log(
      `[EmailQueue] EMAIL_QUEUE_URL non configurata. Invio diretto in locale (${recipients.length} email).`
    );
  

    for (const recipient of recipients) {
      try {
        await sendEmail(recipient, subject, html);
      } catch (err) {
        console.error(`[EmailQueue] Errore invio diretto a ${recipient}:`, err);
      }
    }
    return 1;
  }

  // Produzione: divide in chunk da 50 e invia tramite SQS
  const chunks = chunkArray(recipients, CHUNK_SIZE);

  console.log(
    `[EmailQueue] Invio ${recipients.length} email in ${chunks.length} chunk da max ${CHUNK_SIZE}`
  );

  let sentCount = 0;

  for (const chunk of chunks) {
    const payload = {
      subject,
      html,
      recipients: chunk,
    };

    const messageInput: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    };

    await sqsClient.send(new SendMessageCommand(messageInput));
    sentCount++;
  }

  console.log(
    `[EmailQueue] ${sentCount} messaggi SQS inviati con successo`
  );

  return sentCount;
}
