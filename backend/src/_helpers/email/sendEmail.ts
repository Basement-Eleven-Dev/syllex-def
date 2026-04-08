import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SendEmailPayload } from "../../_triggers/sendEmailTrigger";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";

const sesClient = new SESClient({ region: "eu-south-1" });

/**
 * Invia una singola email tramite AWS SES o mettendola in coda SQS.
 */
export async function sendEmail(to: string, subject: string, html: string, operation: 'send' | 'queue' = 'queue') {
  const queueUrl = process.env.EMAIL_QUEUE_URL;
  if (operation === 'queue' && queueUrl) {
    // Invia il messaggio alla coda SQS
    const payload: SendEmailPayload = {
      subject,
      html,
      recipient: to,
    };
    const messageInput: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    };
    const sqsClient = new SQSClient();
    await sqsClient.send(new SendMessageCommand(messageInput));
    return;
  }
  
  console.log("Invio email a:", to);
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: "Syllex <noreply@syllex.org>",
  });

  try {
    const result = await sesClient.send(command);
    return result;
  } catch (error) {
    console.error("Errore invio email SES:", error);
    throw error;
  }
}

/**
 * Invia email in bulk caricando ogni destinatario nella coda SQS.
 */
export async function sendBulkEmail(params: {
  subject: string;
  html: string;
  recipients: string[];
}): Promise<number> {
  const { subject, html, recipients } = params;
  let sentCount = 0;

  for (const recipient of recipients) {
    try {
      await sendEmail(recipient, subject, html, "queue");
      sentCount++;
    } catch (err) {
      console.error(`[EmailBulk] Errore inserimento in coda per ${recipient}:`, err);
    }
  }

  return sentCount;
}