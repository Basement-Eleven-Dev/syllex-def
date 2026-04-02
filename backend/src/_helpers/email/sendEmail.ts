import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SendEmailPayload } from "../../_triggers/sendEmailTrigger";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";

const sesClient = new SESClient({ region: "eu-south-1" });


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
    try {
      await sqsClient.send(new SendMessageCommand(messageInput));
    }
    catch (error) {
      console.error("Errore invio email alla coda SQS:", error);
    }
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