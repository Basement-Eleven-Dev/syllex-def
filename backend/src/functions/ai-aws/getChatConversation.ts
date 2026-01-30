import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

/**
 * Recupera la conversazione AI più recente associata a un materiale specifico
 * per l'utente corrente.
 */
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

  const { materialId } = JSON.parse(req.body || "{}");

  if (
    !materialId ||
    typeof materialId !== "string" ||
    !ObjectId.isValid(materialId)
  ) {
    return res
      .status(400)
      .json({ message: "È necessario fornire un materialId valido." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const conversationsCollection = db.collection("aiconversations");

    // Cerca la conversazione più recente per questo utente e materiale
    const conversation = await conversationsCollection.findOne(
      {
        userId: user._id,
        materialIds: new ObjectId(materialId),
        aiService: "aws-anthropic",
      },
      {
        sort: { createdAt: -1 },
      }
    );

    return res.status(200).json({
      message: "Conversazione recuperata con successo.",
      conversation: conversation,
    });
  } catch (error: any) {
    console.error("[GetChatConversation] Errore:", {
      message: error.message,
    });
    return res.status(500).json({
      message: "Errore del server durante il recupero della conversazione.",
      error: error.message,
    });
  }
};
