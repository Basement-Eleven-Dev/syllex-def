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
    slides: `Scrivimi ${numberOfSlides || 10} diapositive basate sui documenti forniti. In 'content' inserisci tutto il testo che dovrebbe essere presente compreso di titoli delle slide e specifiche su come presentare le informazioni, senza alcuna spiegazione o testo aggiuntivo. Mantieni il testo conciso e adatto a una presentazione visiva in ambito educativo. Se necessario, organizza le informazioni in punti ed elenchi.`,
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
    let res = await startSlidedeckGeneration({
      inputText: content,
      numCards: numberOfSlides || 10,
      textMode: "preserve",
      exportAs: format || "pptx",
      imageOptions: {
        source: "aiGenerated",
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
