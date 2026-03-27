/**
 * Script di utility per testare l'invio bulk di email tramite SQS.
 *
 * Simula 1000 utenti, li divide in chunk da 50 e invia ogni chunk
 * come messaggio alla coda SQS BulkEmailQueue.
 *
 * Uso:
 *   npx ts-node routines/sendBulkEmailTest.ts
 *
 * Richiede che la variabile d'ambiente EMAIL_QUEUE_URL sia configurata:
 *   EMAIL_QUEUE_URL=https://sqs.eu-south-1.amazonaws.com/... npx ts-node routines/sendBulkEmailTest.ts
 */

import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "eu-south-1" });

const CHUNK_SIZE = 50;
const TOTAL_USERS = 1000;
const QUEUE_URL = process.env.EMAIL_QUEUE_URL || "";

function generateMockEmails(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `studente${i + 1}@example.com`);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  if (!QUEUE_URL) {
    console.error(
      "❌ EMAIL_QUEUE_URL non configurata. Esporta la variabile o passala inline."
    );
    process.exit(1);
  }

  console.log(`🚀 Generazione di ${TOTAL_USERS} email mock...`);
  const emails = generateMockEmails(TOTAL_USERS);

  const chunks = chunkArray(emails, CHUNK_SIZE);
  console.log(
    `📦 Divisi in ${chunks.length} chunk da max ${CHUNK_SIZE} destinatari`
  );

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Nuova comunicazione da Syllex</h2>
      <p>Hai una nuova notifica sulla piattaforma.</p>
      <a href="https://app.syllex.org" 
         style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px;">
        Apri Syllex
      </a>
    </div>
  `;

  let sentCount = 0;

  for (const [index, chunk] of chunks.entries()) {
    const payload = {
      subject: "Nuova comunicazione da Syllex",
      html: htmlBody,
      recipients: chunk,
    };

    const messageInput: SendMessageCommandInput = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(payload),
    };

    try {
      await sqsClient.send(new SendMessageCommand(messageInput));
      sentCount++;
      console.log(
        `  ✅ Chunk ${index + 1}/${chunks.length} inviato (${chunk.length} destinatari)`
      );
    } catch (error) {
      console.error(
        `  ❌ Errore invio chunk ${index + 1}/${chunks.length}:`,
        error
      );
    }
  }

  console.log(`\n🎉 Completato! ${sentCount}/${chunks.length} messaggi SQS inviati.`);
  console.log(`📊 Totale email che verranno processate: ${TOTAL_USERS}`);
}

main();
