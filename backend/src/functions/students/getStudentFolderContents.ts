import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const studentId = user._id;
  const folderId = req.queryStringParameters?.folderId
    ? new ObjectId(req.queryStringParameters.folderId as string)
    : null;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const classesCollection = db.collection("classes");
    const foldersCollection = db.collection("folders");
    const materialsCollection = db.collection("materials");

    const enrolledClasses = await classesCollection
      .find({ studentIds: studentId })
      .project({ _id: 1 })
      .toArray();
    const enrolledClassIds = enrolledClasses.map((c) => c._id);

    if (enrolledClassIds.length === 0 && !folderId) {
      return res.status(200).json({ folders: [], materials: [] });
    }

    let folders: any[] = [];
    let materials: any[] = [];

    if (folderId === null) {
      const classDetails = await classesCollection
        .find({ _id: { $in: enrolledClassIds } })
        .toArray();
      folders = classDetails.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        isClassFolder: true,
      }));
      materials = [];
    } else {
      // --- CASO B: DENTRO UNA CARTELLA (LOGICA CORRETTA) ---
      // Controlliamo se l'ID passato è l'ID di una delle classi dello studente
      const isClassFolder = enrolledClassIds.some((id) => id.equals(folderId));

      if (isClassFolder) {
        // Se è una classe, cerchiamo TUTTI i materiali condivisi con quella classe,
        // indipendentemente dalla loro cartella genitore.
        const sharedMaterials = await materialsCollection
          .find({
            sharedWithClassIds: folderId,
          })
          .sort({ title: 1 })
          .toArray();

        materials = sharedMaterials.map((m) => ({
          ...m,
          _id: m._id.toString(),
          folderId: m.folderId?.toString() || null,
        }));
        // In questa vista, non mostriamo sottocartelle per semplicità.
        folders = [];
      } else {
        // Se NON è una classe, allora è una vera cartella. Usiamo la logica originale.
        const [subfolders, sharedMaterialsInSubfolder] = await Promise.all([
          foldersCollection
            .find({ parentId: folderId })
            .sort({ name: 1 })
            .toArray(),
          materialsCollection
            .find({
              folderId: folderId,
              sharedWithClassIds: { $in: enrolledClassIds },
            })
            .sort({ title: 1 })
            .toArray(),
        ]);

        folders = subfolders.map((f) => ({
          ...f,
          _id: f._id.toString(),
          parentId: f.parentId?.toString() || null,
        }));
        materials = sharedMaterialsInSubfolder.map((m) => ({
          ...m,
          _id: m._id.toString(),
          folderId: m.folderId?.toString() || null,
        }));
      }
    }

    return res.status(200).json({
      folders: folders,
      materials: materials,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore del server durante il recupero dei contenuti",
    });
  }
};
