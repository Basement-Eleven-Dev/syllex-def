import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Organization } from "../../models/schemas/organization.schema";

const getOrganizationById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await connectDatabase()

  const organization = await Organization.findOne({
    _id: new mongo.ObjectId(organizationId),
  }).lean();

  if (!organization) {
    throw createError.NotFound("Organization not found");
  }

  return organization;
};

export const handler = lambdaRequest(getOrganizationById);
