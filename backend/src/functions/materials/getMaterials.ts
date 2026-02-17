import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;
  const subjectId = context.subjectId;

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Query per ottenere tutti i materiali del teacher e della materia
  const query: any = { teacherId };
  if (subjectId) {
    query.subjectId = subjectId;
  }

  // Aggregation per ottenere materiali con stato di vettorizzazione
  const materials = await materialsCollection
    .aggregate([
      { $match: query },
      {
        $lookup: {
          from: "file_embeddings",
          localField: "_id",
          foreignField: "referenced_file_id",
          pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
          as: "embeddings",
        },
      },
      {
        $addFields: {
          isVectorized: { $gt: [{ $size: "$embeddings" }, 0] },
        },
      },
      { $project: { embeddings: 0 } },
    ])
    .toArray();

  return {
    success: true,
    materials,
  };
};

export const handler = lambdaRequest(getMaterials);
