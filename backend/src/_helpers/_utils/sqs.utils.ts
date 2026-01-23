// backend/src/_helpers/_utils/sqs.utils.ts

import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";

/**
 * Avvia un compito in background.
 * In ambiente AWS, invia un messaggio a una coda SQS.
 * In ambiente locale (AWS_SAM_LOCAL=true), esegue una funzione di fallback direttamente.
 *
 * @param queueUrl L'URL della coda SQS da usare in ambiente AWS.
 * @param messageBody Il contenuto del messaggio da inviare (es. un ID).
 * @param localFallbackFn La funzione da eseguire direttamente se in ambiente locale.
 */
export const triggerBackgroundTask = async (
  queueUrl: string | undefined,
  messageBody: string,
  localFallbackFn: () => Promise<void>
) => {
  const isLocal = process.env.AWS_SAM_LOCAL === "true";

  if (isLocal) {
    console.log(
      `[triggerBackgroundTask] Ambiente locale rilevato. Eseguo la funzione di fallback direttamente per il messaggio: ${messageBody}`
    );
    try {
      await localFallbackFn();
      console.log(
        `[triggerBackgroundTask] Esecuzione locale completata con successo.`
      );
    } catch (error) {
      console.error(
        `[triggerBackgroundTask] Errore durante l'esecuzione locale della funzione di fallback:`,
        error
      );
    }
  } else {
    // Ambiente AWS - usa SQS
    if (!queueUrl) {
      console.error(
        `[triggerBackgroundTask] URL della coda non fornito in ambiente AWS. Impossibile inviare il messaggio.`
      );
      // Potresti voler lanciare un errore qui per bloccare il processo
      return;
    }

    console.log(
      `[triggerBackgroundTask] Ambiente AWS. Invio messaggio alla coda: ${queueUrl}`
    );
    const sqsClient = new SQSClient();
    const input: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };

    try {
      await sqsClient.send(new SendMessageCommand(input));
      console.log(
        `[triggerBackgroundTask] Messaggio inviato con successo alla coda SQS.`
      );
    } catch (error) {
      console.error(
        `[triggerBackgroundTask] Errore durante l'invio del messaggio a SQS:`,
        error
      );
    }
  }
};
