import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Test } from "../../models/schemas/test.schema";

const countPublishedTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const subjectId = context.subjectId;

  // Costruisci il filtro
  const filter: any = {
    status: "pubblicato",
    subjectId: subjectId,
  };

  // Solo test del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  // Conta i documenti
  const count = await Test.countDocuments(filter);

  return {
    count: count,
  };
};

export const handler = lambdaRequest(countPublishedTests);
