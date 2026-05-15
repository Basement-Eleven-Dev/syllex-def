import { config } from "dotenv";
import mongoose from "mongoose";
import { FileEmbedding } from "../src/models/schemas/file-embedding.schema";
import { Material } from "../src/models/schemas/material.schema";

config();

const mongoConnectionString = process.env.DBCONNECTION as string;

async function backfillDocumentNames() {
  console.log("🔄 Backfill document_name sui file_embeddings...\n");

  await mongoose.connect(mongoConnectionString, { dbName: "syllex" });

  // Trova tutti i materiali file vettorizzati
  const vectorizedMaterials = await Material.find(
    { type: "file", vectorized: true },
    { _id: 1, name: 1 },
  ).lean();

  console.log(
    `📚 Trovati ${vectorizedMaterials.length} materiali vettorizzati\n`,
  );

  let totalUpdated = 0;

  for (const mat of vectorizedMaterials) {
    const result = await FileEmbedding.updateMany(
      {
        referenced_file_id: mat._id,
        $or: [
          { document_name: "" },
          { document_name: { $exists: false } },
          { document_name: null },
        ],
      },
      { $set: { document_name: mat.name } },
    );

    if (result.modifiedCount > 0) {
      console.log(
        `  ✅ "${mat.name}" → ${result.modifiedCount} chunk aggiornati`,
      );
      totalUpdated += result.modifiedCount;
    }
  }

  console.log(`\n🏁 Completato! ${totalUpdated} chunk aggiornati in totale.`);
  await mongoose.disconnect();
}

backfillDocumentNames().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
