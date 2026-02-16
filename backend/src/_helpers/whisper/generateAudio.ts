import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getOpenAIClient } from "../AI/getOpenAIClient";
import { AWS_REGION, BUCKET_NAME } from "../../../environment";

// Configura il client S3 (assicurati di avere le variabili d'ambiente caricate)
const s3Client = new S3Client({});

export async function generateAndUploadAudio(
  text: string,
  s3Key: string,
  agentVoice: string = "alloy", // Puoi parametrizzare la voce se vuoi
): Promise<string> {
  const openai = await getOpenAIClient();
  try {
    // 1. Generazione Audio con OpenAI
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      input: text,
      voice: agentVoice,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `audio/${s3Key}`,
      Body: buffer,
      ContentType: "audio/mpeg",
    });

    await s3Client.send(command);

    // 4. Restituisci l'URL del file o la chiave
    return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/audio/${s3Key}`;
  } catch (error) {
    console.error("Errore durante la generazione/caricamento audio:", error);
    throw error;
  }
}
