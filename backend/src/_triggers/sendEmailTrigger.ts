import { SQSEvent, SQSHandler } from "aws-lambda";
import { sendEmail } from "../_helpers/email/sendEmail";

/**
 * Payload atteso per ogni messaggio SQS:
 * {
 *   subject: string,           // Oggetto dell'email
 *   html: string,              // Corpo HTML dell'email
 *   recipient: string          // Indirizzo email destinatario (ora gestito singolarmente)
 * }
 */
export interface SendEmailPayload {
  subject: string;
  html: string;
  recipient: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  if (event.Records.length === 0) return;

  for (const record of event.Records) {
    try {
      const payload: SendEmailPayload = JSON.parse(record.body) as SendEmailPayload;
      
      console.log(`[EmailWorker] Invio a ${payload.recipient}: "${payload.subject}"`);
      
      await sendEmail(payload.recipient, payload.subject, payload.html, "send");

      // Ritardo artificiale per restare sotto il limite SES (es. 14/sec).
      // 150ms garantisce max ~6-7 email/sec per istanza Lambda.
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (err) {
      console.error("[EmailWorker] Errore nell'elaborazione del record:", err);
    }
  }
};