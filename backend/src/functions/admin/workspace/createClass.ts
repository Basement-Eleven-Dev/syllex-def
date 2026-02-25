import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const createClassHandler = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const orgId = request.pathParameters?.organizationId;
  if (!orgId) throw createError.BadRequest("Organization ID is required");

  const { name, year } = JSON.parse(request.body || "{}");
  if (!name) throw createError.BadRequest("Class name is required");

  const db = await getDefaultDatabase();
  
  const result = await db.collection("classes").insertOne({
    name,
    organizationId: new ObjectId(orgId),
    year: year || new Date().getFullYear(),
    students: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    success: true,
    classId: result.insertedId.toString(),
    message: "Classe creata con successo"
  };
};

export const handler = lambdaRequest(createClassHandler);
