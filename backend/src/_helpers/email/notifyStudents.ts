import { Db, ObjectId } from "mongodb";
import { getDefaultDatabase } from "../getDatabase";
import { sendBulkEmail } from "./emailQueue";

/**
 * Recupera le email degli studenti dato un array di classIds.
 * Cerca nella collection "classes" i riferimenti agli studenti,
 * poi dalla collection "users" recupera gli username (= email Cognito).
 */
export async function getStudentEmailsByClassIds(
  db: Db,
  classIds: ObjectId[]
): Promise<string[]> {
  if (!classIds || classIds.length === 0) return [];

  // Recupera tutti gli studenti dalle classi
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  // Raccoglie tutti gli studentId unici
  const studentIdSet = new Set<string>();
  for (const cls of classes) {
    for (const sid of cls.students || []) {
      studentIdSet.add(sid.toString());
    }
  }

  if (studentIdSet.size === 0) return [];

  const studentIds = Array.from(studentIdSet).map((id) => new ObjectId(id));

  // Recupera le email (username o email) degli studenti
  const students = await db
    .collection("users")
    .find(
      { _id: { $in: studentIds }, role: "student" },
      { projection: { username: 1, email: 1 } }
    )
    .toArray();

  return students
    .map((s) => s.username || s.email)
    .filter((email): email is string => !!email);
}

/**
 * Tipo per le preferenze di notifica del docente
 */
export type NotificationPreference =
  | "newCommunication"
  | "newEvent"
  | "newTest"
  | "testCorrected";

/**
 * Controlla le preferenze del docente e invia email bulk agli studenti.
 *
 * Questa funzione:
 * 1. Controlla se il docente ha attivato la preferenza specificata
 * 2. Recupera le email degli studenti delle classi coinvolte
 * 3. Invia le email in bulk tramite SQS
 *
 * Non lancia mai errori: logga e fallisce silenziosamente per
 * non bloccare il flusso principale.
 */
export async function notifyStudentsIfEnabled(params: {
  /** L'oggetto user del docente (da context.user) */
  teacher: any;
  /** Quale preferenza controllare */
  preference: NotificationPreference;
  /** ClassIds coinvolti */
  classIds: ObjectId[];
  /** Subject dell'email */
  subject: string;
  /** Body HTML dell'email */
  html: string;
}): Promise<void> {
  try {
    const { teacher, preference, classIds, subject, html } = params;

    // 1. Controlla se le notifiche sono abilitate per questa casistica
    if (!teacher?.notificationSettings?.[preference]) {
      console.log(
        `[Notify] Preferenza '${preference}' non attiva per il docente ${teacher?._id}. Skip.`
      );
      return;
    }

    // 2. Recupera le email degli studenti
    const db = await getDefaultDatabase();
    const studentEmails = await getStudentEmailsByClassIds(db, classIds);

    if (studentEmails.length === 0) {
      console.log(
        `[Notify] Nessuno studente trovato per le classi. Skip.`
      );
      return;
    }

    console.log(
      `[Notify] Invio '${preference}' a ${studentEmails.length} studenti`
    );

    // 3. Invia le email in bulk
    await sendBulkEmail({
      subject,
      html,
      recipients: studentEmails,
    });
  } catch (error) {
    // Non bloccare mai il flusso principale
    console.error("[Notify] Errore durante l'invio notifiche:", error);
  }
}
