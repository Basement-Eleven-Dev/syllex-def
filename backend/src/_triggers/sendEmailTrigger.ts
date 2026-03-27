import { SQSEvent, SQSHandler } from "aws-lambda";
import { sendEmail } from "../_helpers/email/sendEmail";

/**
 * Payload atteso per ogni messaggio SQS:
 * {
 *   subject: string,           // Oggetto dell'email
 *   html: string,              // Corpo HTML dell'email
 *   recipients: string[]       // Array di indirizzi email (max 50 per messaggio)
 * }
 */
interface BulkEmailPayload {
  subject: string;
  html: string;
  recipients: string[];
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  if (event.Records.length === 0) return;

  const record = event.Records[0];
  let payload: BulkEmailPayload;

  try {
    payload = JSON.parse(record.body);
  } catch (parseError) {
    console.error("[EmailWorker] Errore nel parsing del payload:", parseError);
    // Payload malformato: non ritentare
    return;
  }

  console.log(
    `[EmailWorker] Invio email: subject="${payload.subject}", destinatari=${payload.recipients.length}`
  );

  let successCount = 0;
  let failCount = 0;

  for (const recipient of payload.recipients) {
    try {
      await sendEmail(recipient, payload.subject, payload.html);
      successCount++;
    } catch (error: any) {
      // Se è un ThrottlingException, fallisci per permettere il retry di SQS
      if (
        error.name === "ThrottlingException" ||
        error.name === "Throttling" ||
        error.code === "Throttling" ||
        error.$metadata?.httpStatusCode === 429
      ) {
        console.error(
          `[EmailWorker] Throttling dopo ${successCount} email inviate. Retry via SQS.`
        );
        throw error; // SQS riprocesserà il messaggio
      }

      console.error(
        `[EmailWorker] Errore invio a ${recipient}:`,
        error.message
      );
      failCount++;
    }
  }

  console.log(
    `[EmailWorker] Completato: ${successCount} successi, ${failCount} errori su ${payload.recipients.length} totali`
  );
};
