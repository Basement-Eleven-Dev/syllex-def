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

  const { testId } = JSON.parse(req.body || "{}");
  if (!testId || !ObjectId.isValid(testId)) {
    return res
      .status(400)
      .json({ message: "ID del test non valido o mancante" });
  }

  const testObjectId = new ObjectId(testId);
  const studentId = user._id;

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const testsCollection = db.collection("selfAssessmentTests");
    const submissionsCollection = db.collection("selfAssessmentSubmissions");

    const testToRetake = await testsCollection.findOne({
      _id: testObjectId,
      studentId: studentId,
    });

    if (!testToRetake) {
      return res.status(404).json({
        message: "Test di autovalutazione non trovato o non autorizzato",
      });
    }

    const newSubmissionDocument = {
      testId: testObjectId,
      studentId: studentId,
      status: "in-progress",
      startedAt: new Date(),
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const submissionInsertResult = await submissionsCollection.insertOne(
      newSubmissionDocument
    );
    const newSubmissionId = submissionInsertResult.insertedId;

    return res.status(201).json({
      message: "Retake test di autovalutazione creato con successo",
      submissionId: newSubmissionId.toString(),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore del server durante la creazione del nuovo tentativo.",
    });
  }
};
