import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "eu-south-1" });

export async function sendEmail(to: string, subject: string, html: string) {
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