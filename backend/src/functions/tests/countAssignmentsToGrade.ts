import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Attempt } from "../../models/schemas/attempt.schema";

const countAssignmentsToGrade = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();
  const { onlyCount = 'true', excludeStatus = 'reviewed' } = request.queryStringParameters || {};
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
    const count = await Attempt.countDocuments(filter);

    return {
      count: count,
    };
  }
  else return await Attempt.find(filter);
};

export const handler = lambdaRequest(countAssignmentsToGrade);
