import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { Test } from "./createTest";

/**
 * Funzione Lambda per aggiornare un test "modello".
 * Accessibile ad admin e al docente creatore.
 */
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

  const { testId, updates } = JSON.parse(req.body || "{}");

  if (!testId || !ObjectId.isValid(testId)) {
    return res.status(400).json({ message: "ID Test non valido o mancante." });
  }
  if (!updates || typeof updates !== "object") {
    return res
      .status(400)
      .json({ message: "Dati di aggiornamento non validi." });
  }

  const testObjectId = new ObjectId(testId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection<Test>("tests");

    const testToUpdate = await testsCollection.findOne({ _id: testObjectId });
    if (!testToUpdate) {
      return res.status(404).json({ message: "Test non trovato." });
    }

    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(testToUpdate.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      isAuthorized = testToUpdate.teacherId?.equals(user._id) || false;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Non sei autorizzato a modificare questo test." });
    }

    // Rimuoviamo i campi protetti che non devono mai essere modificati
    delete updates._id;
    delete updates.teacherId;
    delete updates.subjectId;
    delete updates.organizationId;
    delete updates.createdAt;

    // Se vengono passate le domande, le processiamo e ricalcoliamo i punti
    if (Array.isArray(updates.questions)) {
      let calculatedTotalPoints = 0;
      updates.questions = updates.questions.map((q: any) => {
        const points = q.points && typeof q.points === "number" ? q.points : 0;
        calculatedTotalPoints += points;
        return {
          ...q,
          _id:
            q._id && ObjectId.isValid(q._id)
              ? new ObjectId(q._id)
              : new ObjectId(),
        };
      });
      updates.totalPoints = calculatedTotalPoints;
    }

    const finalUpdate: { $set: any; $unset?: any } = { $set: {} };

    if (updates.password !== undefined) {
      if (
        updates.password &&
        typeof updates.password === "string" &&
        updates.password.length > 0
      ) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10);
      } else {
        if (!finalUpdate.$unset) finalUpdate.$unset = {};
        finalUpdate.$unset.passwordHash = ""; // Rimuove il campo
      }
      delete updates.password; // Rimuoviamo la password in chiaro dal payload finale
    }

    updates.updatedAt = new Date();
    finalUpdate.$set = updates;

    const result = await testsCollection.findOneAndUpdate(
      { _id: testObjectId },
      finalUpdate,
      { returnDocument: "after" }
    );

    if (!result) {
      return res
        .status(404)
        .json({ message: "Test non trovato durante l'aggiornamento." });
    }

    return res.status(200).json({
      message: `Test "${result.title}" aggiornato con successo.`,
      test: result,
    });
  } catch (error: any) {
    console.error("Errore aggiornamento test:", error);
    return res.status(500).json({
      message: "Errore del server durante l'aggiornamento del test.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
