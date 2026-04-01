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
export interface SendEmailPayload {
  subject: string;
  html: string;
  recipient: string;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  if (event.Records.length === 0) return;
  const record = event.Records;
  const payload: SendEmailPayload = JSON.parse(record[0].body) as SendEmailPayload;
  await sendEmail(payload.recipient, payload.subject, payload.html, 'send');
}