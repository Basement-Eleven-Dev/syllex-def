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
import { MaterialDocument } from "./createMaterialWithFiles"; // Importiamo la nostra interfaccia ibrida

/**
 * Funzione Lambda per recuperare i dettagli di un singolo materiale.
 * Esegue una validazione dei permessi basata sul ruolo dell'utente.
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

  // Per coerenza, usiamo il body anche per le GET
  const { materialId } = JSON.parse(req.body || "{}");

  if (!materialId || !ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ message: "ID del materiale non valido o mancante." });
  }

  const materialObjectId = new ObjectId(materialId);

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection<MaterialDocument>("materials");
    const classesCollection = db.collection("classes");

    // 1. Troviamo il materiale
    const material = await materialsCollection.findOne({
      _id: materialObjectId,
    });
    if (!material) {
      return res.status(404).json({ message: "Materiale non trovato." });
    }

    // 2. Logica di autorizzazione basata sul ruolo
    let isAuthorized = false;
    if (user.role === "admin") {
      isAuthorized =
        user.organizationIds?.some((id) =>
          id.equals(material.organizationId)
        ) || false;
    } else if (user.role === "teacher") {
      // Un docente è autorizzato se insegna la materia a cui il materiale appartiene
      const count = await classesCollection.countDocuments({
        "teachingAssignments.teacherId": user._id,
        "teachingAssignments.subjectId": material.subjectId,
      });
      isAuthorized = count > 0;
    } else if (user.role === "student") {
      // Uno studente è autorizzato se il materiale è stato assegnato a uno dei suoi incarichi
      const count = await classesCollection.countDocuments({
        studentIds: user._id,
        "teachingAssignments.assignedMaterialIds": material._id,
      });
      isAuthorized = count > 0;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({
          message: "Non sei autorizzato a visualizzare questo materiale.",
        });
    }

    // 3. Se autorizzato, restituiamo il materiale
    return res.status(200).json({
      message: "Materiale recuperato con successo.",
      material: material,
    });
  } catch (error) {
    console.error("Errore durante il recupero del materiale:", error);
    return res.status(500).json({
      message: "Errore del server durante il recupero del materiale.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};
