import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getOrganizationById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  const db = await getDefaultDatabase();
  const organizationsCollection = db.collection("organizations");

  const organization = await organizationsCollection.findOne({
    _id: new ObjectId(organizationId!),
  });

  if (!organization) {
    throw createError.NotFound("Organization not found");
  }

  return organization;
};

export const handler = lambdaRequest(getOrganizationById);
