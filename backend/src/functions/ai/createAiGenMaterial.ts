import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { MaterialInterface } from "../../models/material";
import { startSlidedeckGeneration } from "../../_helpers/gammaApi";
import { uploadContentToS3 } from "../../_helpers/uploadFileToS3";
import { getConvertedDocument } from "../../_helpers/documents/documentConversion";
import { askStructuredLLM } from "../../_helpers/AI/simpleCompletion";
import { z } from "zod";

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
    Use the ${language} language.
    Give the response a brief title. 
    Answer the query using only the information provided in the attached documents.
    Do not use any outside knowledge, facts, or assumptions not explicitly stated in these files.`;

  const prompts: Record<DocumentType, string> = {
    slides: `Write me a ${numberOfSlides || 10}-slides content based on these documents.`,
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
  return (
    prompts[type] + "\n" + (additionalInstructions || "\n") + "\n" + guardRails
  );
};

const createAIGenMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const {
    type,
    materialIds,
    numberOfSlides,
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

  const db = await getDefaultDatabase();
  const materialCollection = db.collection("materials");
  const organizationCollection = db.collection("organizations");
  const materialOIds = materialIds.map((el) => new ObjectId(el));
  const materialObjects: MaterialInterface[] = (await materialCollection
    .find({ _id: { $in: materialOIds } })
    .toArray()) as MaterialInterface[]; //forse non serve

  const prompt = getPrompt(
    type,
    language,
    numberOfSlides,
    additionalInstructions,
  );
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

  const organization = await organizationCollection.findOne({
    _id: context.user!.organizationId,
  });

  const organizationLogoUrl: string = organization!.logoUrl;
  const organizationName: string = organization!.name; //unused for now

  const material: MaterialInterface = {
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
    let bucketKey = "ai_gen/" + material.name;
    material.url = await uploadContentToS3(bucketKey, pdfFile, mimetype);
  }

  if (type == "slides") {
    let res = await startSlidedeckGeneration({
      inputText: content,
      numCards: numberOfSlides || 10,
      textMode: "preserve",
      exportAs: "pptx",
      imageOptions: {
        source: "webFreeToUse",
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
    const prefix = process.env.LOCAL_TESTING ? "http://" : "https://";
    material.url = `${prefix}${request.requestContext.domainName}/${request.requestContext.stage}/proxy/gamma/${res.generationId}`;
    material.extension = "pptx";
    material.name = title + "." + material.extension;
  }
  if (type == "map") {
    material.extension = "txt";
    material.name = title + "." + material.extension;
    let bucketKey = "ai_gen/" + material.name;
    let mimetype = "text/plain; charset=utf-8";
    material.isMap = true;
    material.url = await uploadContentToS3(bucketKey, content, mimetype);
  }

  const insertResult = await materialCollection.insertOne(material);

  return {
    material: {
      ...material,
      _id: insertResult.insertedId,
    },
  };
};

export const handler = lambdaRequest(createAIGenMaterial);
