import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
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

  const { assignmentId } = JSON.parse(req.body || "{}");

  if (!assignmentId || !ObjectId.isValid(assignmentId)) {
    return res
      .status(400)
      .json({ message: "ID dell'assegnazione non valido." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const assignmentsCollection = db.collection("testAssignments");

    const result = await assignmentsCollection.deleteOne({
      _id: new ObjectId(assignmentId),
      teacherId: user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Assegnazione non trovata o non autorizzato a cancellarla.",
      });
    }

    return res
      .status(200)
      .json({ message: "Assegnazione rimossa con successo." });
  } catch (error) {
    console.error("Errore durante la cancellazione dell'assegnazione:", error);
    return res.status(500).json({ message: "Errore del server." });
  }
};
