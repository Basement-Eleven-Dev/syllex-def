import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { startSlidedeckGeneration } from "../../_helpers/gammaApi";
import { uploadContentToS3 } from "../../_helpers/uploadFileToS3";
import { getConvertedDocument } from "../../_helpers/documents/documentConversion";
import { askStructuredLLM } from "../../_helpers/AI/simpleCompletion";
import { fetchBuffer } from "../../_helpers/fetchBuffer";
import { z } from "zod";
import { Organization } from "../../models/schemas/organization.schema";

const documentTypes = ["slides", "map", "glossary", "summary"] as const;

// 2. Derive the type from the array (so you don't have to write it twice!)
type DocumentType = (typeof documentTypes)[number];

function isDocumentType(value: any): value is DocumentType {
  return documentTypes.includes(value);
}

export type AIGenMaterialInput = {
  type: DocumentType;
  materialIds: string[];
  numberOfSlides?: number;
  format?: "pptx" | "pdf";
  additionalInstructions?: string;
  language?: string;
};

const getPrompt = (
  type: DocumentType,
  language: string = "italian",
  numberOfSlides: number = 10,
  additionalInstructions?: string,
) => {
  const guardRails: string = `
    Scrivi tutto il contenuto in ${language}.
    Dai alla risposta un titolo breve.
    Rispondi utilizzando ESCLUSIVAMENTE le informazioni fornite nel prompt. Nessuna informazione non direttamente fornita in questo prompt può essere utilizzata per generare la risposta. Non utilizzare conoscenze pregresse o esterne a quanto fornito. Quanto fornito deve essere sufficente per generare la risposta completa.
    `;

  const prompts: Record<DocumentType, string> = {
    slides: `Crea esattamente ${numberOfSlides || 10} diapositive basate ESCLUSIVAMENTE sui documenti forniti, seguendo questa struttura rigida:

REGOLE OBBLIGATORIE:
- La PRIMA diapositiva è sempre la diapositiva di titolo: titolo della presentazione (max 8 parole) e un sottotitolo che elenca i principali argomenti trattati.
- Ogni diapositiva successiva segue ESATTAMENTE questo formato:
  ## [TITOLO SLIDE] (max 8 parole, descrittivo del contenuto)
  - [punto 1: concetto chiave con spiegazione sintetica]
  - [punto 2: concetto chiave con spiegazione sintetica]
  - [punto 3: concetto chiave con spiegazione sintetica]
  (aggiungi un 4° o 5° punto solo se strettamente necessario)
- L'ultima diapositiva è un riepilogo dei concetti chiave.

REGOLE TASSATIVE SUL CONTENUTO:
- Ogni punto elenco deve contenere informazioni dense e precise, non frasi generiche.
- NON inserire mai descrizioni di immagini, placeholder visivi, riferimenti a grafici o elementi grafici di alcun tipo.
- NON scrivere frasi come "qui va un'immagine", "inserire grafico", "vedi figura" o simili.
- Il testo è la priorità assoluta: le slide devono essere comprensibili e complete di per sé.
- In 'content' inserisci SOLO il testo delle slide nel formato indicato, senza spiegazioni o testo aggiuntivo esterno alle slide.`,
    map: `
Write a valid mermaid.js diagram based on these documents.

STRICT RULES:
- Use ONLY alphanumeric IDs (letters/numbers, no spaces, no dots)
- Subgraphs MUST have an ID and a label: subgraph ID["Label"]
- NEVER use numeric-only IDs
- NEVER reference undefined nodes
- Output ONLY mermaid code, no explanations, no backticks
`,
    glossary: `Write me a glossary based on these documents. Use Markdown.`,
    summary: `Write me a medium length summary of these documents. Use Markdown.`,
  };

  let promptResult = prompts[type];
  if (additionalInstructions) {
    promptResult +=
      `\nHere are some additional instructions to must follow when creating the ${type}: ` +
      additionalInstructions;
  }
  promptResult += "\n" + guardRails;
  return promptResult;
};

const createAIGenMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const {
    type,
    materialIds,
    numberOfSlides,
    format,
    additionalInstructions,
    language,
  } = JSON.parse(request.body || "{}") as AIGenMaterialInput;

  //error handling
  if (!type || !isDocumentType(type))
    throw createHttpError.BadRequest(
      `type field is required. Accepted values: ${documentTypes.join(", ")}. You passed "${type}"`,
    );
  if (!(materialIds && materialIds.length > 0))
    throw createHttpError.BadRequest(
      "type materialIds is required and not empty: string[]",
    );

  // Check storage limit (1GB)
  const STORAGE_LIMIT_B = 1024 * 1024 * 1024;
  const currentMaterials = await Material.find({
    teacherId: context.user!._id as any,
    subjectId: context.subjectId as any,
  });

  const totalBytes = currentMaterials.reduce(
    (acc, m) => acc + (m.byteSize || 0),
    0,
  );
  if (totalBytes >= STORAGE_LIMIT_B) {
    throw createHttpError(
      400,
      "Limite di archiviazione (1GB) raggiunto per questa materia.",
    );
  }

  await connectDatabase();
  const materialOIds = materialIds.map((el) => new mongo.ObjectId(el));
  const materialObjects = await Material.find({
    _id: { $in: materialOIds as any },
    subjectId: context.subjectId as any,
    aiGenerated: { $ne: true },
  });

  // Fetch all text buffers and validate combined content length
  let totalTextLength = 0;
  for (const m of materialObjects) {
    if (m.extractedTextFileUrl) {
      try {
        const buffer = await fetchBuffer(m.extractedTextFileUrl);
        totalTextLength += buffer.toString("utf-8").trim().length;
      } catch (e) {
        console.error(`Failed to fetch buffer for material ${m._id}:`, e);
      }
    }
  }

  // If there are materials selected but they have less than 150 characters, reject
  if (materialObjects.length > 0 && totalTextLength < 150) {
    throw createHttpError.BadRequest(
      `Non è possibile avviare la generazione automatica perché il documento selezionato non contiene testo sufficiente (rilevati solo ${totalTextLength} caratteri). Per garantire l'accuratezza didattica dei materiali ed evitare che l'Intelligenza Artificiale inventi di sana pianta concetti non presenti (fenomeno delle allucinazioni), è necessario che il file di riferimento contenga del testo concreto (come dispense, capitoli di libri o appunti). Ti invitiamo a caricare un documento completo di testo e riprovare!`
    );
  }

  const prompt = getPrompt(
    type,
    language,
    numberOfSlides,
    additionalInstructions,
  );

  console.log("Generated prompt for LLM:", prompt);
  //LLM STRUCTURES
  const DocumentSchema = z.object({
    title: z.string(),
    content: z.string(),
  });
  const { title, content } = await askStructuredLLM(
    prompt,
    materialObjects,
    DocumentSchema,
  );

  console.log("LLM response:", { title, content });

  const organizationId = context.user?.organizationIds?.[0];

  const organization = await Organization.findOne({
    _id: organizationId,
  });

  if (!organization) {
    throw createHttpError(404, "Organization not found");
  }

  const organizationLogoUrl: string = organization.logoUrl ?? "";
  const organizationName: string = organization.name; //unused for now

  const material: Partial<Material> = {
    name: "", //find a way to get a real name
    createdAt: new Date(),
    aiGenerated: true,
    type: "file",
    teacherId: context.user!._id,
    subjectId: context.subjectId!,
    generatedFrom: materialOIds,
  };

  if (type == "glossary" || type == "summary") {
    //aggiungi intestazione
    let fileName = title;
    let markDownFilename = fileName + ".md";
    material.extension = "docx";
    let mimetype =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    let destinationFilename = fileName + "." + material.extension;
    let pdfFile = await getConvertedDocument(
      content,
      markDownFilename,
      destinationFilename,
    );
    material.name = destinationFilename;
    material.byteSize = pdfFile.length;
    let bucketKey = "ai_gen/" + material.name;
    material.url = await uploadContentToS3(bucketKey, pdfFile, mimetype);
  }

  if (type == "slides") {
    const GAMMA_INSTRUCTIONS_BASE =
      "Text and information are the absolute priority. Use images ONLY when strictly necessary to visually explain a specific concept — never for decoration. Prefer simple pictographic icons. Aim for at most 1 image every 3-4 slides.";
    const gammaAdditionalInstructions = additionalInstructions
      ? `${GAMMA_INSTRUCTIONS_BASE} | ${additionalInstructions}`.slice(0, 1000)
      : GAMMA_INSTRUCTIONS_BASE;

    let res = await startSlidedeckGeneration({
      inputText: content,
      numCards: numberOfSlides || 10,
      textMode: "preserve",
      exportAs: format || "pptx",
      additionalInstructions: gammaAdditionalInstructions,
      imageOptions: {
        source: "pictographic",
      },
      textOptions: {
        amount: "medium",
      },
      cardOptions: {
        headerFooter: {
          topLeft: {
            type: "image",
            source: "custom",
            src: organizationLogoUrl,
          },
        },
      },
    });

    console.log("\n\n");
    console.log("Gamma API response:", res);
    console.log("\n\n");

    const prefix = process.env.LOCAL_TESTING ? "http://" : "https://";
    material.url = `${prefix}${request.requestContext.domainName}${request.requestContext.stage ? "/" + request.requestContext.stage : ""}/proxy/gamma/${res.generationId}`;
    material.extension = format || "pptx";
    material.name = title + "." + material.extension;
  }
  if (type == "map") {
    material.extension = "txt";
    material.name = title + "." + material.extension;
    material.byteSize = Buffer.byteLength(content, "utf8");
    let bucketKey = "ai_gen/" + material.name;
    let mimetype = "text/plain; charset=utf-8";
    material.isMap = true;
    material.url = await uploadContentToS3(bucketKey, content, mimetype);
  }

  const createdMaterial = await Material.create(material as any);

  return {
    material: createdMaterial.toObject(),
  };
};

export const handler = lambdaRequest(createAIGenMaterial);
