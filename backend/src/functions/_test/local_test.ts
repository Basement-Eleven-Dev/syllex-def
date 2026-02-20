
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { extractPDFWithGoogleDocumentAI } from "../../_helpers/AI/exctractWithGeminiVision";

const runTest = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    const domain = event.requestContext.domainName;
    const path = event.requestContext.path;
    const prefix = process.env.LOCAL_TESTING ? 'http://' : 'https://'
    const fullUrl = prefix + domain + path;
    return fullUrl;
    /*const { materialId } = JSON.parse(request.body || '{}')
    const db = (await getDefaultDatabase());
    const material = await db.collection('materials').findOne({ _id: new ObjectId(materialId as string) })
    const httpResultFile = await fetch(material!.url!);
    if (!httpResultFile.ok || !httpResultFile.body) {
        throw new Error(`Could not fetch file or body is empty. Status: ${httpResultFile.status}`);
    }
    const arrayBuffer = await httpResultFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractPDFWithGoogleDocumentAI(buffer)
    return extraction*/
}

export const handler = lambdaRequest(runTest);