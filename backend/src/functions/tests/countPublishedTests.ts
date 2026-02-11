import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Test } from "../../models/test";
import { ObjectId } from "mongodb";

const countPublishedTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  const { subjectId } = request.pathParameters || {};

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
    status: "pubblicato",
    subjectId: new ObjectId(subjectId),
  };

  // Solo test del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  // Conta i documenti
  const count = await testsCollection.countDocuments(filter);

  return {
    count: count,
  };
};

export const handler = lambdaRequest(countPublishedTests);
