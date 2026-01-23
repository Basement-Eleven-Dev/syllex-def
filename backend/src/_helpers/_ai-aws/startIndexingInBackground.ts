import { Db, ObjectId } from "mongodb";
import { MaterialDocument } from "../../functions/materials/createMaterialWithFiles";
import { extractTextFromS3File } from "../_utils/file.utils";
import { chunkText } from "./chunkText";
import { createEmbedding } from "./assistant.service";

/**
 * Funzione helper che esegue il lavoro pesante di indicizzazione in background.
 */
export async function startIndexingInBackground(
  db: Db,
  material: MaterialDocument
): Promise<void> {
  const materialId = material._id as ObjectId;
  const materialsCollection = db.collection("materials");

  console.log(
    `[startIndexing] 1. Processo in background AVVIATO per il materiale ${materialId}.`
  );

  try {
    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "in-progress" } }
    );
    console.log(
      `[startIndexing] 2. Stato del materiale ${materialId} impostato su 'in-progress'.`
    );

    let textContent = "";
    if (material.generatedContent) {
      textContent = material.generatedContent;
      console.log(
        `[startIndexing] 3a. Trovato 'generatedContent'. Lunghezza: ${textContent.length}`
      );
    } else if (material.files && material.files.length > 0) {
      const fileToProcess = material.files[0];
      const BUCKET_NAME = process.env.BUCKET_NAME;
      if (!BUCKET_NAME) throw new Error("BUCKET_NAME non configurato.");

      console.log(
        `[startIndexing] 3b. Inizio estrazione testo da S3 per il file: ${fileToProcess.storagePath}`
      );
      textContent = await extractTextFromS3File(
        BUCKET_NAME,
        fileToProcess.storagePath,
        fileToProcess.mimetype
      );
      console.log(
        `[startIndexing] 4. Estrazione testo da S3 completata. Lunghezza: ${textContent.length}`
      );
    }

    if (!textContent || textContent.trim() === "") {
      throw new Error(
        "Nessun contenuto testuale trovato per l'indicizzazione."
      );
    }

    const textChunks = chunkText(textContent);
    console.log(
      `[startIndexing] 5. Testo diviso in ${textChunks.length} pezzi.`
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
    console.log(
      `[startIndexing] 6. Creati ${chunksToInsert.length} embedding.`
    );

    if (chunksToInsert.length > 0) {
      const chunksCollection = db.collection("document_chunks");
      await chunksCollection.deleteMany({ materialId });
      await chunksCollection.insertMany(chunksToInsert);
      console.log(`[startIndexing] 7. Pezzi salvati nel database vettoriale.`);
    }

    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "completed" } }
    );
    console.log(
      `[startIndexing] 8. Indicizzazione completata con successo per ${materialId}.`
    );
  } catch (error: any) {
    // Questo log ci mostrerà l'errore esatto
    console.error(
      `[startIndexing] ERRORE CRITICO durante l'indicizzazione di ${materialId}:`,
      {
        errorStack: error.stack,
      }
    );
    await materialsCollection.updateOne(
      { _id: materialId },
      { $set: { indexingStatus: "failed" } }
    );
  }
}
