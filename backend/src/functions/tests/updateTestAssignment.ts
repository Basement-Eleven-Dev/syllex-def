import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Db, ObjectId, UpdateFilter } from "mongodb"; // Importa UpdateFilter
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../_helpers/config/env";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import * as bcrypt from "bcryptjs";
import { TestAssignment } from "./createTestAssignment";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || !["admin", "teacher"].includes(user.role)) {
    return res.status(403).json({ message: "Accesso negato." });
  }

  // Leggiamo TUTTO dal corpo della richiesta
  const {
    assignmentId,
    availableFrom,
    availableUntil,
    durationMinutes,
    password,
  } = JSON.parse(req.body || "{}");

  if (!assignmentId || !ObjectId.isValid(assignmentId)) {
    return res
      .status(400)
      .json({ message: "ID dell'assegnazione non valido o mancante." });
  }

  const assignmentObjectId = new ObjectId(assignmentId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const assignmentsCollection =
      db.collection<TestAssignment>("testAssignments");

    const existingAssignment = await assignmentsCollection.findOne({
      _id: assignmentObjectId,
    });
    if (!existingAssignment) {
      return res.status(404).json({ message: "Assegnazione non trovata." });
    }
    if (!existingAssignment.teacherId.equals(user._id)) {
      return res.status(403).json({
        message: "Non sei autorizzato a modificare questa assegnazione.",
      });
    }

    // --- CORREZIONE: Costruiamo l'operazione di aggiornamento nel modo corretto ---
    const fieldsToSet: Partial<TestAssignment> = {
      updatedAt: new Date(),
    };
    const fieldsToUnset: { [key: string]: "" } = {};

    if (availableFrom) fieldsToSet.availableFrom = new Date(availableFrom);
    else fieldsToUnset.availableFrom = "";
    if (availableUntil) fieldsToSet.availableUntil = new Date(availableUntil);
    else fieldsToUnset.availableUntil = "";
    if (durationMinutes)
      fieldsToSet.durationMinutes = parseInt(String(durationMinutes), 10);
    else fieldsToUnset.durationMinutes = "";
    if (password) {
      fieldsToSet.passwordHash = await bcrypt.hash(password, 10);
    } else {
      if (existingAssignment.passwordHash) {
        fieldsToUnset.passwordHash = "";
      }
    }

    const updateOperation: UpdateFilter<TestAssignment> = { $set: fieldsToSet };
    if (Object.keys(fieldsToUnset).length > 0) {
      updateOperation.$unset = fieldsToUnset;
    }

    await assignmentsCollection.updateOne(
      { _id: assignmentObjectId },
      updateOperation
    );

    return res.status(200).json({
      message: "Assegnazione aggiornata con successo.",
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'assegnazione:", error);
    return res.status(500).json({
      message: "Errore del server durante l'aggiornamento.",
    });
  }
};
