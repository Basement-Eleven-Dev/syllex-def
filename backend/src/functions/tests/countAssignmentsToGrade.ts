import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const countAssignmentsToGrade = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const attemptsCollection = db.collection("attempts");

  const subjectId = context.subjectId;

  if (!subjectId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "subjectId is required",
      }),
    };
  }

  // Costruisci il filtro
  const filter: any = {
    status: { $ne: "reviewed" },
    subjectId: subjectId,
  };

  // Solo attempt del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  // Conta i documenti
  const count = await attemptsCollection.countDocuments(filter);

  return {
    count: count,
  };
};

export const handler = lambdaRequest(countAssignmentsToGrade);
