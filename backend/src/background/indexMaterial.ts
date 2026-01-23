import { SQSEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../_helpers/getDatabase";
import { DB_NAME } from "../_helpers/config/env";
import { MaterialDocument } from "../functions/materials/createMaterialWithFiles";
import { extractTextFromS3File } from "../_helpers/_utils/file.utils";
import { chunkText } from "../_helpers/_ai-aws/chunkText";
import { createEmbedding } from "../_helpers/_ai-aws/assistant.service";

/**
 * Funzione "core" che esegue l'intero processo di indicizzazione.
 * Riceve un ID, recupera i dati e fa tutto il lavoro pesante.
 * @param materialIdString L'ID del materiale da indicizzare.
 */
export const performIndexing = async (materialIdString: string) => {
  if (!materialIdString || !ObjectId.isValid(materialIdString)) {
    console.error(
      `[performIndexing] Ricevuto materialId non valido: ${materialIdString}. Messaggio scartato.`
    );
    return;
  }
  const materialId = new ObjectId(materialIdString);

  const db: Db = (await mongoClient()).db(DB_NAME);
  const materialsCollection = db.collection("materials");

  console.log(
    `[performIndexing] 1. Processo in background AVVIATO per il materiale ${materialId}.`
  );

  try {
    const material = (await materialsCollection.findOne({
      _id: materialId,
    })) as MaterialDocument | null;

    if (!material) {
      throw new Error(
        `Materiale con ID ${materialId} non trovato nel database.`
      );
    }

    if (material.generationStatus === "in-progress") {
      console.log(
        `[performIndexing SQS] Generazione materiale ${materialId} ancora in corso. Trigger SQS ignorato. La chiamata diretta post-generazione si occuperà dell'indicizzazione.`
      );
      return; // Esce dalla funzione senza errori
    }
    console.log(
      `[performIndexing] Materiale trovato. Stato attuale: ${material.indexingStatus}`
    );

    // Possiamo aggiungere un controllo per evitare di re-indicizzare materiale già processato
    if (material.indexingStatus !== "pending") {
      console.warn(
        `[performIndexing] Il materiale ${materialId} non è in stato 'pending'. Processo interrotto.`
      );
      return;
    }

    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "in-progress" } }
    );
    console.log(
      `[performIndexing] 2. Stato del materiale ${materialId} impostato su 'in-progress'.`
    );

    // --- Inizia la logica di 'startIndexingInBackground' ---
    let textContent = "";
    if (material.generatedContent) {
      textContent = material.generatedContent;
    } else if (material.files && material.files.length > 0) {
      const fileToProcess = material.files[0];
      const BUCKET_NAME = process.env.BUCKET_NAME;
      if (!BUCKET_NAME) throw new Error("BUCKET_NAME non configurato.");

      textContent = await extractTextFromS3File(
        BUCKET_NAME,
        fileToProcess.storagePath,
        fileToProcess.mimetype
      );
    }

    if (!textContent || textContent.trim() === "") {
      throw new Error(
        "Nessun contenuto testuale trovato per l'indicizzazione."
      );
    }

    const textChunks = chunkText(textContent);
    console.log(
      `[performIndexing] Testo diviso in ${textChunks.length} pezzi.`
    );

    const chunksToInsert = [];
    for (const chunk of textChunks) {
      const embedding = await createEmbedding(chunk);
      chunksToInsert.push({
        materialId,
        teacherId: material.teacherId,
        storagePath: material.files?.[0]?.storagePath || null,
        text: chunk,
        embedding: embedding,
        createdAt: new Date(),
      });
    }

    if (chunksToInsert.length > 0) {
      const chunksCollection = db.collection("document_chunks");
      await chunksCollection.deleteMany({ materialId });
      await chunksCollection.insertMany(chunksToInsert);
      console.log(`[performIndexing] Pezzi salvati nel database vettoriale.`);
    }

    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "completed" } }
    );
    console.log(
      `[performIndexing] 8. Indicizzazione completata con successo per ${materialId}.`
    );
  } catch (error: any) {
    console.error(
      `[performIndexing] ERRORE CRITICO durante l'indicizzazione di ${materialId}:`,
      error
    );
    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "failed", indexingError: error.message } }
    );
  }
};

/**
 * Questo è l'handler SQS. Il suo unico scopo è fare da "ponte"
 * tra l'evento SQS e la nostra logica di business.
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(
    `[Handler SQS - Indexing] Ricevuto un batch di ${event.Records.length} messaggi.`
  );
  for (const record of event.Records) {
    const materialId = record.body;
    try {
      await performIndexing(materialId);
    } catch (error) {
      console.error(
        `[Handler SQS - Indexing] Fallito il processamento del messaggio per il materiale ${materialId}.`
      );
      throw error;
    }
  }
};
