import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Class } from "../../../models/schemas/class.schema";

const createClassHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const orgId = request.pathParameters?.organizationId;
  if (!orgId) throw createError.BadRequest("Organization ID is required");

  const { name, year } = JSON.parse(request.body || "{}");
  if (!name) throw createError.BadRequest("Class name is required");

  await connectDatabase();

  const result = await Class.insertOne({
    name,
    organizationId: new mongo.ObjectId(orgId),
    year: year || new Date().getFullYear(),
    students: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    classId: result._id.toString(),
    message: "Classe creata con successo"
  };
};

export const handler = lambdaRequest(createClassHandler);
