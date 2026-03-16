import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const countAssignmentsToGrade = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const { onlyCount = 'true', excludeStatus = 'reviewed' } = request.queryStringParameters || {};
  const attemptsCollection = db.collection("attempts");
  const subjectId = context.subjectId;

  // Costruisci il filtro
  const filter: any = {
    status: { $ne: excludeStatus },
    subjectId: subjectId,
  };

  // Solo attempt del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }
  if (JSON.parse(onlyCount)) {

    // Conta i documenti
    const count = await attemptsCollection.countDocuments(filter);

    return {
      count: count,
    };
  }
  else return await attemptsCollection.find(filter).toArray();
};

export const handler = lambdaRequest(countAssignmentsToGrade);
