import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { MaterialInterface } from "../../models/material";
import { startSlidedeckGeneration } from "../../_helpers/gammaApi";
import { uploadContentToS3 } from "../../_helpers/uploadFileToS3";
import { askLLM } from "../../_helpers/AI/simpleCompletion";
import { getConvertedDocument } from "../../_helpers/documents/documentConversion";

export type AIGenMaterialInput = {
    type: 'slides' | 'map' | 'glossary' | 'summary',
    materialIds: string[],
    numberOfSlides?: number,
    additionalInstructions?: string,
    language?: string
}

const getPrompt = (type: AIGenMaterialInput['type'], language: string = 'it', numberOfSlides: number = 10, additionalInstructions?: string) => {
    const guardRails: string = `
    Use the ${language || 'it'} language.
    Answer the query using only the information provided in the attached documents.
    Do not use any outside knowledge, facts, or assumptions not explicitly stated in these files.`

    const prompts: Record<AIGenMaterialInput['type'], string> = {
        'slides': `Write me a ${numberOfSlides || 10}-slides content based on these documents.`,
        'map': "Write me a mermaid.js based diagram code based on these documents. Answer only with the code, nothing else. No natural language, no pleasantries, no intros, nothing, only code.",
        'glossary': `Write me a glossary based on these documents. Use Markdown.`,
        'summary': `Write me a medium length summary of these documents. Use Markdown.`
    }
    return prompts[type] + '\n' + additionalInstructions + '\n' + guardRails;
}


const createAIGenMaterial = async (
    request: APIGatewayProxyEvent,
    context: Context,
) => {
    const { type, materialIds, numberOfSlides, additionalInstructions, language } = JSON.parse(request.body || '{}') as AIGenMaterialInput

    //error handling
    if (!type) throw createHttpError.BadRequest("type field is required: 'slides'|'map'|'glossary'|'summary'");
    if (!materialIds) throw createHttpError.BadRequest("type materialIds is required: string[]");


    const db = await getDefaultDatabase();
    const materialCollection = db.collection('materials')
    const organizationCollection = db.collection('organizations')
    const materialObjects: MaterialInterface[] = await materialCollection.find({ _id: { $in: materialIds.map(el => new ObjectId(el)) } }).toArray() as MaterialInterface[];

    const prompt = getPrompt(type, language, numberOfSlides, additionalInstructions)
    const llmInputMaterialUrls: string[] = materialObjects.map(el => el.url!)
    const resultContent = await askLLM(prompt, llmInputMaterialUrls)

    const organization = await organizationCollection.findOne({ _id: context.user!.organizationId });

    const organizationLogoUrl: string = organization!.logoUrl;
    const organizationName: string = organization!.name; //unused for now

    const material: MaterialInterface = {
        name: "", //find a way to get a real name
        createdAt: new Date(),
        aiGenerated: true,
        teacherId: context.user!._id,
        subjectId: context.subjectId!
    }
    if (type == 'glossary' || type == 'summary') {
        let fileName = type + new ObjectId().toString();
        let markDownFilename = fileName + '.md'
        let destinationFilename = fileName + '.pdf'
        let bucketKey = 'ai_gen/' + material.name;
        let mimetype = 'application/pdf'
        let pdfFile = await getConvertedDocument(resultContent, markDownFilename, destinationFilename)

        material.name = destinationFilename;
        material.url = await uploadContentToS3(bucketKey, pdfFile, mimetype);
    }
    if (type == 'slides') {
        let res = await startSlidedeckGeneration({
            inputText: resultContent,
            textMode: 'preserve',
            exportAs: 'pptx',
            cardOptions: {
                headerFooter: {
                    topLeft: {
                        type: "image",
                        source: "custom",
                        src: organizationLogoUrl
                    }
                }
            }
        })

        material.url = `https://${request.requestContext.domainName}/${request.requestContext.stage}/proxy/gamma/${res.generationId}`;
        material.name = type + new ObjectId().toString() + '.pptx';
    }
    if (type == 'map') {
        let bucketKey = 'ai_gen/' + material.name;
        let mimetype = 'text/plain'
        material.isMap = true;

        material.url = await uploadContentToS3(bucketKey, resultContent, mimetype);
        material.name = type + new ObjectId().toString() + '.txt';
    }



    const insertResult = await materialCollection.insertOne(material);

    return {
        material: {
            ...material,
            _id: insertResult.insertedId
        }
    }
}

export const handler = lambdaRequest(createAIGenMaterial);
