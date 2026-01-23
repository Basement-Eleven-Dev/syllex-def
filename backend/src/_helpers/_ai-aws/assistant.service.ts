import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  AWS_REGION,
  ANTHROPIC_MODEL_ID,
  AWS_EMBEDDING_MODEL_ID,
  DB_NAME,
  NOVA_MODEL_ID,
} from "../config/env";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../getDatabase";

let bedrockClient: BedrockRuntimeClient | undefined;

const ENABLED_STAGES_LOGGING = ['stg', 'prod']

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    // Controlla che tutte le credenziali necessarie siano state configurate

    bedrockClient = new BedrockRuntimeClient({
      region: AWS_REGION,
    });
  }
  return bedrockClient;
}

/**
 * Invia un prompt al modello Anthropic Claude tramite AWS Bedrock e restituisce la risposta.
 * @param systemPrompt - Le istruzioni di sistema per il modello (es. "Sei un assistente utile").
 * @param userPrompt - La domanda o il testo dell'utente.
 * @param isJsonMode - Se true, richiede al modello di rispondere in formato JSON.
 * @returns {Promise<string>} La risposta testuale del modello.
 */
export const getAnthropicResponse = async (
  systemPrompt: string,
  userPrompt: string,
  isJsonMode: boolean = false,
  callType: string = 'generic'
): Promise<string> => {
  const client = getBedrockClient();

  if (!ANTHROPIC_MODEL_ID) {
    throw new Error("ID del modello Anthropic non configurato.");
  }

  // Costruisce il payload nel formato specifico richiesto da Anthropic Claude su Bedrock
  const payload = {
    anthropic_version: "bedrock-2023-05-31", // Versione richiesta da Bedrock
    max_tokens: 65536, // Massimo numero di token nella risposta
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: userPrompt }],
      },
    ],
  };

  // Prepara il comando da inviare a Bedrock
  const command = new InvokeModelCommand({
    modelId: ANTHROPIC_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    // Invia il comando e attende la risposta
    const apiResponse = await client.send(command);

    // Decodifica la risposta (che è in formato Uint8Array) in una stringa JSON
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    // Estrae il contenuto testuale dalla risposta di Claude
    const responseText = responseBody.content?.[0]?.text || "";
    if (ENABLED_STAGES_LOGGING.includes(process.env.STAGE as string)) {

      const usage = responseBody.usage;
      let client = await mongoClient();
      await client.db('Analytics').collection('ClaudeUsage').insertOne({
        usage: usage,
        executedAt: new Date(),
        type: callType
      })
    }
    if (!responseText) {
      console.warn(
        "[AWS Service] La risposta del modello era vuota o in formato non valido.",
        responseBody
      );
      throw new Error("L'assistente non ha fornito una risposta valida.");
    }

    return responseText;
  } catch (error: any) {
    console.error("[AWS Service] Errore in getAnthropicResponse:", error);
    // Rilancia l'errore per essere gestito dal chiamante
    throw new Error(`Errore Servizio AWS: ${error.message || "Sconosciuto"}`);
  }
};
export const getNovaResponse = async (
  systemPrompt: string,
  userPrompt: string,
  isJsonMode: boolean = false
): Promise<string> => {
  const client = getBedrockClient();

  if (!NOVA_MODEL_ID) {
    throw new Error("ID del modello NOVA non configurato.");
  }

  // Costruisce il payload nel formato specifico richiesto da Anthropic Claude su Bedrock
  const payload = {
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
  };

  // Prepara il comando da inviare a Bedrock
  const command = new InvokeModelCommand({
    modelId: NOVA_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    // Invia il comando e attende la risposta
    const apiResponse = await client.send(command);

    // Decodifica la risposta (che è in formato Uint8Array) in una stringa JSON
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    // Estrae il contenuto testuale dalla risposta di Claude
    const responseText =
      responseBody?.output?.message?.content?.[0]?.text || "";

    if (!responseText) {
      console.warn(
        "[AWS Service] La risposta del modello era vuota o in formato non valido.",
        JSON.stringify(responseBody)
      );
      throw new Error("L'assistente non ha fornito una risposta valida.");
    }

    return responseText;
  } catch (error: any) {
    console.error("[AWS Service] Errore in getNovaResponse:", error);
    // Rilancia l'errore per essere gestito dal chiamante
    throw new Error(`Errore Servizio AWS: ${error.message || "Sconosciuto"}`);
  }
};

/**
 * Converte una stringa di testo in un vettore numerico (embedding) usando un modello AWS Titan.
 * @param text Il testo da convertire.
 * @returns Una promise che si risolve con un array di numeri (il vettore).
 * npm install @aws-sdk/client-bedrock --> specifico per il client Bedrock
 */

export const createEmbedding = async (text: string): Promise<number[]> => {
  const client = getBedrockClient();

  if (!AWS_EMBEDDING_MODEL_ID) {
    throw new Error("ID del modello di Embedding AWS non configurato");
  }

  const payload = {
    inputText: text,
  };

  const command = new InvokeModelCommand({
    modelId: AWS_EMBEDDING_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    const apiResponse = await client.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    const embedding = responseBody.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error(
        "La risposta dell'API di embedding non conteneva un vettore valido."
      );
    }

    return embedding;
  } catch (error: any) {
    throw new Error(
      `Errore Servizio Embedding AWS: ${error.message} || 'catch di createEmbedding`
    );
  }
};

/**
 * DOPO AVER INDICIZZATO IL MATERIALE CON LA FUNZIONE PRECEDENTE USIAMO QUESTA PER INTERROGARLO
 * Esegue una ricerca vettoriale per trovare il contesto pertinente e poi genera una risposta
 * usando un modello linguistico.
 * @param query La domanda o il prompt dell'utente.
 * @param materialIds Un array di ID dei materiali su cui basare la ricerca.
 * @returns Una promise che si risolve con la risposta generata dall'AI.
 */

export const getRagResponse = async (
  query: string,
  materialIds: string[],
  systemPrompt?: string,
  callType: string = 'generic'
): Promise<string> => {
  const queryEmbedding = await createEmbedding(query);

  const db: Db = (await mongoClient()).db(DB_NAME);
  const chunksCollection = db.collection("document_chunks");

  const materialObjectIds = materialIds.map((id) => new ObjectId(id));

  const searchResults = await chunksCollection
    .aggregate([
      {
        $vectorSearch: {
          index: "dc_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10, // Aumentiamo leggermente i risultati per un contesto più ricco
          filter: { materialId: { $in: materialObjectIds } },
        },
      },
      { $project: { _id: 0, text: 1, score: { $meta: "vectorSearchScore" } } },
      { $match: { score: { $gte: 0.5 } } }, // Filtra solo i risultati con una buona pertinenza
    ])
    .toArray();

  if (searchResults.length === 0) {
    return "Sorry, I could not find relevant information in the provided documents to answer your question.";
  }

  const context = searchResults
    .map((result) => result.text)
    .join("\n\n---\n\n");

  // Usa il systemPrompt fornito, o un default se non specificato
  const finalSystemPrompt =
    systemPrompt ||
    "You are an expert AI assistant. Answer the user's question based EXCLUSIVELY on the provided context.";
  const userPrompt = `CONTEXT:\n${context}\n\nQUESTION: ${query}\n\nANSWER:`;

  const finalResponse = await getAnthropicResponse(
    finalSystemPrompt,
    userPrompt,
    true,
    callType
  );
  return finalResponse;
};
