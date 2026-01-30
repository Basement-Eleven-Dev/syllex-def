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

  const { folderId: folderIdString, subjectId: subjectIdString } = JSON.parse(
    req.body || "{}"
  );

  const folderId = folderIdString ? new ObjectId(folderIdString) : null;

  if (!subjectIdString || !ObjectId.isValid(subjectIdString)) {
    return res
      .status(400)
      .json({ message: "È necessario fornire un ID di materia valido." });
  }
  const subjectObjectId = new ObjectId(subjectIdString);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const foldersCollection = db.collection("folders");
    const materialsCollection = db.collection("materials");
    const classesCollection = db.collection("classes");

    // L'autorizzazione basata sugli incarichi è corretta
    const assignmentCount = await classesCollection.countDocuments({
      "teachingAssignments.teacherId": user._id,
      "teachingAssignments.subjectId": subjectObjectId,
    });

    if (assignmentCount === 0) {
      return res.status(403).json({
        message:
          "Non sei autorizzato ad accedere ai materiali di questa materia.",
      });
    }

    const [folders, materials] = await Promise.all([
      // --- INIZIO CORREZIONE ---
      foldersCollection
        .find({
          parentId: folderId,
          subjectId: subjectObjectId, // Aggiunto il filtro per materia
        })
        .sort({ name: 1 })
        .toArray(),
      // --- FINE CORREZIONE ---

      materialsCollection
        .find({
          folderId: folderId,
          subjectId: subjectObjectId,
        })
        .sort({ title: 1 })
        .toArray(),
    ]);

    return res.status(200).json({
      folders,
      materials,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero dei contenuti della cartella:",
      error
    );
    return res.status(500).json({
      message: "Errore del server durante il recupero dei contenuti.",
    });
  }
};
