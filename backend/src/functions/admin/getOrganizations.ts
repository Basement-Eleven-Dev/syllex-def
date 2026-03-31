import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Organization } from "../../models/schemas/organization.schema";

const getOrganizations = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  // Per ora prendiamo tutte le organizzazioni. 
  // In futuro potremmo aggiungere paginazione e filtri.
  const organizations = await Organization.find({}).sort({ createdAt: -1 }).lean()

  return {
    success: true,
    organizations
  };
};

export const handler = lambdaRequest(getOrganizations);
