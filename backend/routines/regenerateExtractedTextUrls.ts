/**
 * Routine: regenerateExtractedTextUrls
 *
 * Rigenera il file di testo estratto per ogni materiale già vettorizzato
 * e aggiorna il campo `extractedTextFileUrl` nel database.
 *
 * Utilizzo:
 *   STAGE=stg npx ts-node routines/regenerateExtractedTextUrls.ts
 *   STAGE=prod npx ts-node routines/regenerateExtractedTextUrls.ts --dry-run
 *   STAGE=stg npx ts-node routines/regenerateExtractedTextUrls.ts --limit 50
 */
import { connectDatabase } from "../src/_helpers/getDatabase";
import { Material } from "../src/models/schemas/material.schema";
import { fetchBuffer } from "../src/_helpers/fetchBuffer";
import { extractTextFromFile } from "../src/_helpers/documents/extractTextFromFile";
import { uploadContentToS3 } from "../src/_helpers/uploadFileToS3";
import { config } from "dotenv";

config();

process.env.AWS_PROFILE = "pathway";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitArgRaw = args.find((a) => a.startsWith("--limit="));
const limitArg = limitArgRaw
  ? limitArgRaw.split("=")[1]
  : args[args.indexOf("--limit") + 1];
const LIMIT = limitArg && !isNaN(Number(limitArg)) ? Number(limitArg) : 0;

async function regenerateSingle(
  material: InstanceType<typeof Material>,
): Promise<"updated" | "skipped" | "error"> {
  if (!material.url || !material.extension) {
    console.warn(`  [SKIP] ${material._id} — url o extension mancanti`);
    return "skipped";
  }

  try {
    const buffer = await fetchBuffer(material.url);
    const text = await extractTextFromFile(buffer, material.extension);
    const s3Key = `extracted-text${material._id.toString()}.txt`;

    if (DRY_RUN) {
      console.log(
        `  [DRY]  ${material._id} — testo estratto (${text.length} chars), S3 key: ${s3Key}`,
      );
      return "updated";
    }

    const newUrl = await uploadContentToS3(s3Key, text, "text/plain");
    if (!newUrl) throw new Error("uploadContentToS3 ha restituito undefined");

    material.extractedTextFileUrl = newUrl;
    await material.save();

    console.log(`  [OK]   ${material._id} → ${newUrl}`);
    return "updated";
  } catch (err) {
    console.error(`  [ERR]  ${material._id}:`, (err as Error).message);
    return "error";
  }
}

async function main() {
  console.log(`=== regenerateExtractedTextUrls ===`);
  console.log(`STAGE   : ${process.env.STAGE ?? "stg"}`);
  console.log(`DRY_RUN : ${DRY_RUN}`);
  console.log(`LIMIT   : ${LIMIT || "nessuno"}`);
  console.log();

  await connectDatabase();

  // Seleziona materiali con extractedTextFileUrl errato (non .txt)
  // oppure tutti i vettorizzati se si vuole forzare la rigenerazione completa
  const query = Material.find({
    vectorized: true,
    url: { $exists: true },
    $or: [
      { extractedTextFileUrl: { $exists: false } },
      { extractedTextFileUrl: { $not: /\.txt$/ } },
    ],
  });
  if (LIMIT > 0) query.limit(LIMIT);

  const materials = await query.exec();
  console.log(`Trovati ${materials.length} materiali da aggiornare\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const material of materials) {
    const result = await regenerateSingle(material);
    if (result === "updated") updated++;
    else if (result === "skipped") skipped++;
    else errors++;
  }

  console.log();
  console.log("=== Riepilogo ===");
  console.log(`  Aggiornati : ${updated}`);
  console.log(`  Saltati    : ${skipped}`);
  console.log(`  Errori     : ${errors}`);

  if (DRY_RUN) console.log("\n[DRY RUN attivo — nessuna modifica applicata]");

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Errore fatale:", err);
  process.exit(1);
});
