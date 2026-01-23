import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId, Db } from "mongodb";
import { mongoClient } from "../../../_helpers/getDatabase";
import { DB_NAME } from "../../../_helpers/config/env";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";
import { createAndLinkUser } from "../../../_helpers/user/user.helpers";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Accesso negato. Funzionalità riservata agli amministratori.",
      });
    }

    const { organizationId, email, password, firstName, lastName, role } =
      JSON.parse(req.body || "{}");

    if (!organizationId || !ObjectId.isValid(organizationId)) {
      return res
        .status(400)
        .json({ message: "ID dell'organizzazione non valido." });
    }
    if (!email || !firstName || !lastName || !role) {
      return res
        .status(400)
        .json({ message: "Email, nome, cognome e ruolo sono obbligatori." });
    }
    if (!["teacher", "student"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Il ruolo può essere solo 'teacher' o 'student'." });
    }

    const orgObjectId = new ObjectId(organizationId);

    if (!user.organizationIds?.some((id) => id.equals(orgObjectId))) {
      return res.status(403).json({
        message:
          "Non sei autorizzato a creare membri per questa organizzazione.",
      });
    }

    const db: Db = (await mongoClient()).db(DB_NAME);

    const newUser = await createAndLinkUser(db, {
      email,
      password,
      firstName,
      lastName,
      role,
      organizationIds: [orgObjectId],
    });

    // NON gestiamo admin qui - solo teacher e student
    // Gli admin si creano solo da terminale con la routine

    return res.status(201).json({
      message: `Utente ${role} "${firstName} ${lastName}" creato con successo!`,
      user: newUser,
    });
  } catch (error: any) {
    console.error("Errore in createMember:", error);

    if (error.name === "UsernameExistsException") {
      return res
        .status(409)
        .json({ message: "Un utente con questa email esiste già." });
    }

    return res.status(500).json({
      message: "Errore del server durante la creazione del membro.",
      error: error.message || "Errore sconosciuto",
    });
  }
};
