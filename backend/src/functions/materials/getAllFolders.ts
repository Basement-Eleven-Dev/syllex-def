import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Folder } from "./createFolder";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { subjectId } = JSON.parse(req.body || "{}");

  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res
      .status(400)
      .json({ message: "ID della materia non valido o mancante." });
  }

  const subjectObjectId = new ObjectId(subjectId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const foldersCollection = db.collection<Folder>("folders");
    const classesCollection = db.collection("classes");

    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": subjectObjectId,
    });

    if (assignmentCount === 0) {
      return res.status(200).json({ folders: [] });
    }

    // La query ora filtra solo per subjectId, che è il modo corretto
    const folders = await foldersCollection
      .find({
        subjectId: subjectObjectId,
      })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({ folders });
  } catch (error) {
    console.error("Errore durante il recupero delle cartelle:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero delle cartelle.",
    });
  }
};
