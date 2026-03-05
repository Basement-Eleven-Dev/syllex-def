import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getOrganizations = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const organizationsCollection = db.collection("organizations");

  // Per ora prendiamo tutte le organizzazioni. 
  // In futuro potremmo aggiungere paginazione e filtri.
  const organizations = await organizationsCollection.find({}).sort({ createdAt: -1 }).toArray();

  return {
    success: true,
    organizations
  };
};

export const handler = lambdaRequest(getOrganizations);
