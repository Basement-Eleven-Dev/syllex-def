import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const folderId = req.queryStringParameters?.folderId as string;
  if (!folderId || !ObjectId.isValid(folderId as string)) {
    return res.status(400).json({ message: "ID cartella invalido o mancante" });
  }

  const rootFolderId = new ObjectId(folderId as string);
  const teacherId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const foldersCollection = db.collection("folders");
    const materialsCollection = db.collection("materials");

    //  Trova ricorsivamente tutti gli ID delle sottocartelle
    const folderIdsToSearch: ObjectId[] = [rootFolderId];
    const foldersToScan: ObjectId[] = [rootFolderId];

    while (foldersToScan.length > 0) {
      const currentId = foldersToScan.pop();
      const subfolders = await foldersCollection
        .find({
          parentId: currentId,
          teacherId: teacherId,
        })
        .project({ _id: 1 })
        .toArray();
      for (const subfolder of subfolders) {
        folderIdsToSearch.push(subfolder._id);
        foldersToScan.push(subfolder._id);
      }
    }

    // Trova tutti i materiali all'interno di questo albero di cartelle
    const materials = await materialsCollection
      .find({
        folderId: { $in: folderIdsToSearch },
        teacherId: teacherId,
      })
      .project({ _id: 1 })
      .toArray();

    const materialIds = materials.map((m) => m._id.toString());

    return res.status(200).json({ materialIds });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error while fetching materials." });
  }
};
