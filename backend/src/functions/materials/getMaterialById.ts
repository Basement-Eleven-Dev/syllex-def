import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getMaterialById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    return { success: false, message: "Unauthorized" };
  }

  const materialId = request.pathParameters?.materialId;
  if (!materialId) {
    return { success: false, message: "materialId is required" };
  }

  const db = await getDefaultDatabase();

  const material = await db.collection("materials").findOne({
    _id: new ObjectId(materialId),
  });

  if (!material) {
    return { success: false, message: "Material not found or not accessible" };
  }

  return { success: true, material };
};

export const handler = lambdaRequest(getMaterialById);
