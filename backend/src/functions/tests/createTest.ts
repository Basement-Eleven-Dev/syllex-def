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

// --- MODIFICA 1: La "Cianografia" potenziata con commenti chiari ---
export interface Test {
  _id?: ObjectId;
  title: string;
  description?: string;
  subjectId: ObjectId; // NUOVO: A quale materia appartiene il test.
  organizationId: ObjectId; // NUOVO: A quale organizzazione appartiene.
  teacherId?: ObjectId; // DA RIMUOVERE: Il creatore originale. Opzionale per una transizione sicura.
  subject?: string; // DA RIMUOVERE: Sostituito da subjectId. Opzionale per una transizione sicura.
  materialIds?: ObjectId[];
  language?: string;
  questions?: any[];
  status?: "draft" | "published" | "archived";
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
  assignedToClassIds?: ObjectId[]; // DA RIMUOVERE: Sostituito da `testAssignments`. Opzionale per ora.
  durationMinutes?: number;
  availableFrom?: Date;
  availableUntil?: Date;
  passwordHash?: string;
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || !user._id) {
    return res
      .status(401)
      .json({ message: "Accesso negato: Utente non autenticato." });
  }
  if (user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Accesso negato. Riservato ai docenti." });
  }

  const teacherId: ObjectId = user._id;

  try {
    const {
      title,
      description,
      subjectId,
      organizationId,
      materialIds: materialIdsInput,
      questions,
      status,
      language,
      durationMinutes,
      availableFrom,
      availableUntil,
      password,
    } = JSON.parse(req.body || "{}");

    const materialIds = Array.isArray(materialIdsInput)
      ? materialIdsInput
      : materialIdsInput
      ? [materialIdsInput]
      : [];

    // Validazioni aggiornate
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res
        .status(400)
        .json({ message: "Il titolo del test è obbligatorio." });
    }
    if (!subjectId || !ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        message:
          "È necessario associare il test a una materia valida (subjectId).",
      });
    }
    if (!organizationId || !ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        message:
          "È necessario specificare un'organizzazione (organizationId) valida.",
      });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Il test deve contenere almeno una domanda." });
    }
    if (
      availableFrom &&
      availableUntil &&
      new Date(availableUntil) < new Date(availableFrom)
    ) {
      return res.status(400).json({
        message:
          "La data di fine disponibilità non può essere antecedente a quella di inizio",
      });
    }

    let calculatedTotalPoints = 0;
    const questionsWithIds = (questions || []).map((q: any) => {
      const points = q && typeof q.points === "number" ? q.points : 0;
      calculatedTotalPoints += points;
      const questionId =
        q._id && ObjectId.isValid(q._id) ? new ObjectId(q._id) : new ObjectId();
      return { ...q, _id: questionId, points: points };
    });
    const materialObjectIds = (materialIds || [])
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    const newTestData: Omit<Test, "_id"> = {
      title: title.trim(),
      description: description?.trim() || "",

      subjectId: new ObjectId(subjectId),
      organizationId: new ObjectId(organizationId),

      // Campi "vecchi" mantenuti per retrocompatibilità
      teacherId: teacherId,

      materialIds: materialObjectIds,
      questions: questionsWithIds,
      status: status || "draft",
      totalPoints: calculatedTotalPoints,
      language: language || "italian",
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedToClassIds: [],
    };

    if (
      durationMinutes &&
      !isNaN(parseInt(durationMinutes)) &&
      parseInt(durationMinutes) > 0
    ) {
      newTestData.durationMinutes = parseInt(durationMinutes);
    }
    if (availableFrom) {
      newTestData.availableFrom = new Date(availableFrom);
    }
    if (availableUntil) {
      newTestData.availableUntil = new Date(availableUntil);
    }
    if (password && typeof password === "string" && password.length > 0) {
      const saltRounds = 10;
      newTestData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const db: Db = (await mongoClient()).db(DB_NAME);
    const result = await db.collection("tests").insertOne(newTestData);

    if (!result.insertedId) {
      throw new Error(
        "Creazione test fallita: inserimento nel DB non riuscito."
      );
    }

    const savedTest = await db
      .collection("tests")
      .findOne({ _id: result.insertedId });
    if (!savedTest) {
      throw new Error("Impossibile recuperare il test appena creato.");
    }

    const testForFrontend = {
      ...savedTest,
      _id: savedTest._id.toString(),
      teacherId: savedTest.teacherId.toString(),
      questions: (savedTest.questions || []).map((q: any) => ({
        ...q,
        _id: q._id.toString(),
      })),
      materialIds: (savedTest.materialIds || []).map((id: any) =>
        id.toString()
      ),
      assignedToClassIds: (savedTest.assignedToClassIds || []).map((id: any) =>
        id.toString()
      ),
      createdAt: new Date(savedTest.createdAt).toISOString(),
      updatedAt: new Date(savedTest.updatedAt).toISOString(),
    };

    return res.status(201).json({
      message: `Test "${savedTest.title}" creato con successo!`,
      test: testForFrontend,
    });
  } catch (error: any) {
    console.error("Errore durante la creazione del test:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione del test.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
