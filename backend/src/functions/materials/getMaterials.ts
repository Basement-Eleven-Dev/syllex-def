import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;
  const subjectId = request.pathParameters?.subjectId;

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Query per ottenere tutti i materiali del teacher e della materia
  const query: any = { teacherId };
  if (subjectId) {
    query.subjectId = new ObjectId(subjectId);
  }

  const materials = await materialsCollection.find(query).toArray();

  return {
    success: true,
    materials,
  };
};

export const handler = lambdaRequest(getMaterials);
