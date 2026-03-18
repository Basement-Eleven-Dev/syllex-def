import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Handler,
} from "aws-lambda";
import { getGammaExportUrl } from "../../_helpers/gammaApi";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  let generationID: string = event.pathParameters!.generationId!;
  let gammaUrl = await getGammaExportUrl(generationID);
  const domain = event.requestContext.domainName;
  const path = event.requestContext.path;
  const prefix = process.env.LOCAL_TESTING ? "http://" : "https://";
  const fullUrl = prefix + domain + path;
  console.log("full url:", fullUrl);
  if (!gammaUrl) {
    return {
      headers: { "Access-Control-Allow-Origin": "*" },
      statusCode: 404,
      body: "Not ready",
    };
  }
  await connectDatabase();
  await Material.updateOne(
    { url: fullUrl },
    { $set: { url: gammaUrl } }
  );
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ url: gammaUrl }),
  };
};
