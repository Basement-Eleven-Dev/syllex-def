import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user!;
  const userId = user._id;
  const subjectId = context.subjectId!

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");
  if (user.role == 'student') {
    const classes = await db
      .collection("classes")
      .find({ students: { $in: [userId] } })
      .toArray();

    if (classes.length === 0) {
      return { success: true, materials: [] };
    }

    const classIds = classes.map((c) => c._id);
    console.log(classIds);

    // Recupera i materiali della materia selezionata che sono accessibili alle classi dello studente
    const materials = await db
      .collection("materials")
      .find({
        subjectId: subjectId,
        classIds: { $in: classIds },
        type: "file",
      })
      .toArray();
    return { materials }
  }
  // Query per ottenere tutti i materiali del teacher e della materia
  const query: any = { teacherId: userId };
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
