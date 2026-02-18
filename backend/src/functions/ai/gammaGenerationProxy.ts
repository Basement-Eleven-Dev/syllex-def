import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from "aws-lambda";
import { getGammaExportUrl } from "../../_helpers/gammaApi";
import { getDefaultDatabase } from "../../_helpers/getDatabase";


export const handler: Handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    let generationID: string = event.pathParameters!.generationId!;
    let gammaUrl = await getGammaExportUrl(generationID)
    const domain = event.requestContext.domainName;
    const path = event.requestContext.path;
    const fullUrl = `https://${domain}${path}`;
    console.log('full url:', fullUrl)
    if (!gammaUrl) {
        return {
            headers: { "Access-Control-Allow-Origin": "*", },
            statusCode: 404,
            body: "Not ready"
        }
    }
    const db = await getDefaultDatabase();
    const materialCollection = db.collection('materials');
    await materialCollection.updateOne({ url: fullUrl }, { $set: { url: gammaUrl } })
    return {
        statusCode: 301,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Location": gammaUrl
        },
        body: ''
    };

}