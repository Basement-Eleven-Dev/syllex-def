/**
 * Vocabolario azioni — traduce l'identità tecnica di un evento in un'etichetta
 * italiana leggibile, per i report descrittivi (enti) e per la UI admin.
 *
 * Due famiglie di chiavi:
 *  - HTTP: chiave normalizzata `metodo route-senza-slash` (es. "get test/{testId}/attempt").
 *    La normalizzazione riconcilia il formato locale (metodo minuscolo, resourcePath
 *    senza slash) con quello AWS (GET maiuscolo, /route con slash).
 *  - Semantiche (eventi ai/client/system): la `action` è già parlante (es. "material.open").
 *
 * Le etichette sono frasi-sostantivo da "registro di audit". Per le route non
 * mappate c'è un fallback che umanizza la route, così non si rompe mai nulla.
 */

const normalizeKey = (
  method?: string | null,
  route?: string | null,
): string => {
  const m = (method || "").toLowerCase().trim();
  const r = (route || "").replace(/^\//, "").trim();
  return `${m} ${r}`.trim();
};

/** Eventi HTTP — chiave: `metodo route` normalizzata. */
const ACTION_LABELS: Record<string, string> = {
  // --- Auth & profilo ---
  "get profile": "Consultazione del profilo",
  "patch profile/email": "Modifica email",
  "patch profile/policies": "Accettazione delle policy",
  "patch profile/terms": "Accettazione dei termini",
  "post auth/forgot-password": "Richiesta reset password",
  "post auth/reset-password": "Reset della password",
  "get admin/password/{email}": "Recupero password (admin)",

  // --- Materiali (docenti) ---
  "get materials": "Elenco materiali",
  "get materials/{materialId}": "Dettaglio materiale",
  "post materials": "Creazione materiale",
  "post files/upload": "Caricamento file",
  "put materials/{materialId}/rename": "Rinomina materiale",
  "post materials/{materialId}/move": "Spostamento materiale",
  "put materials/{materialId}/classes": "Assegnazione materiale alle classi",
  "delete materials/{materialId}": "Eliminazione materiale",
  "post batch/materials/delete": "Eliminazione materiali (batch)",
  "post batch/materials/move": "Spostamento materiali (batch)",
  "post batch/materials/vectorize": "Vettorizzazione materiali (batch)",

  // --- Generazione AI ---
  "post ai/materials": "Generazione materiale con AI",
  "post ai/questions": "Generazione domande con AI",
  "post ai/rag-search": "Ricerca nei materiali (RAG)",
  "post ai/help-chat": "Chat di assistenza (AI)",
  "post ai/generatetoken": "Generazione token vocale Gemini",
  "get ai/list-materials": "Elenco materiali per l'AI",

  // --- Assistente / Chat ---
  "get assistant": "Consultazione assistente",
  "post assistant": "Creazione assistente",
  "put assistant": "Modifica assistente",
  "post assistant/response": "Risposta dell'assistente (chat)",
  "delete assistant/materials/{materialId}": "Rimozione materiale dall'assistente",
  "get messages": "Cronologia messaggi conversazione",
  "get messages/list-conversations": "Elenco conversazioni",
  "post messages/save": "Salvataggio messaggio",
  "delete messages/{conversationId}": "Eliminazione conversazione",

  // --- Test & domande ---
  "get tests": "Elenco test",
  "get tests/{testId}": "Dettaglio test",
  "post tests": "Creazione test",
  "put tests/{testId}": "Modifica test",
  "delete tests/{testId}": "Eliminazione test",
  "post tests/{testId}/duplicate": "Duplicazione test",
  "put tests/{testId}/classes": "Assegnazione test alle classi",
  "post tests/{testId}/insight": "Insight AI del test",
  "get questions": "Elenco domande",
  "get questions/all": "Elenco completo domande",
  "get questions/{questionId}": "Dettaglio domanda",
  "post questions": "Creazione domanda",
  "put questions/{questionId}": "Modifica domanda",
  "delete questions/{questionId}": "Eliminazione domanda",
  "post questions/batch": "Creazione domande (batch)",
  "post questions/list": "Elenco domande (batch)",

  // --- Tentativi (studenti) ---
  "get test/{testId}/attempt": "Consultazione tentativo di un test",
  "post test/{testId}/attempt": "Avvio tentativo del test",
  "put test/{testId}/attempt/{attemptId}": "Aggiornamento tentativo",
  "post test/{testId}/attempt/{attemptId}/submit": "Consegna del tentativo",
  "get test/{testId}/attempts-details": "Dettagli tentativi del test",
  "post attempts": "Autovalutazione / avvio tentativo",
  "get attempts": "Compiti da correggere (conteggio)",
  "post attempts/batch": "Stato tentativi (batch)",
  "get attempts/questions-count": "Conteggio domande tentativi",
  "get attempts/{attemptId}/details": "Dettaglio tentativo",
  "get attempts/{attemptId}/insight": "Insight AI del tentativo",
  "post attempts/{attemptId}/correction": "Correzione manuale del tentativo",
  "post attempts/{attemptId}/questions/{questionId}/ai-correction":
    "Correzione AI di una risposta",

  // --- Classi / materie / argomenti / eventi / comunicazioni ---
  "get classes": "Elenco classi",
  "get classes/{classId}/students": "Studenti della classe",
  "get classes/{classId}/tests": "Test della classe",
  "get classes/{classId}/attempts": "Tentativi della classe",
  "get classes/{classId}/topics-performance":
    "Performance per argomento della classe",
  "get subjects": "Elenco materie",
  "get assignments": "Elenco assegnazioni",
  "post topics": "Creazione argomento",
  "put topics/{topicId}": "Modifica argomento",
  "delete topics/{topicId}": "Eliminazione argomento",
  "get events": "Elenco eventi",
  "post events": "Creazione evento",
  "put events/{eventId}": "Modifica evento",
  "delete events/{eventId}": "Eliminazione evento",
  "get communications": "Elenco comunicazioni",
  "get communications/{communicationId}": "Dettaglio comunicazione",
  "post communications": "Creazione comunicazione",
  "put communications/{communicationId}": "Modifica comunicazione",
  "delete communications/{communicationId}": "Eliminazione comunicazione",
  "get students/{studentId}": "Dettaglio studente",
  "get students/{studentId}/insight": "Insight AI dello studente",
  "get organizations/{organizationId}": "Dettaglio organizzazione",

  // --- Segnalazioni / questionari pubblici ---
  "get reports": "Elenco segnalazioni",
  "post reports": "Creazione segnalazione",
  "put reports/:id": "Aggiornamento segnalazione",
  "get public/surveys/{slug}": "Apertura questionario pubblico",
  "post public/surveys/{slug}/submit": "Invio risposte questionario pubblico",

  // --- Gamma / sistema ---
  "get proxy/gamma/{generationId}": "Stato generazione Gamma",
  "get health": "Health check",
  "get status": "Stato del servizio",
  "get error-manager": "Gestione errori",
  "post telemetry": "Telemetria client",

  // --- Admin ---
  "post admin/onboarding": "Onboarding organizzazione",
  "get admin/organizations": "Elenco organizzazioni",
  "get admin/organizations/stats": "Statistiche organizzazioni",
  "get admin/global-stats": "Statistiche globali (admin)",
  "get admin/organizations/{organizationId}/workspace":
    "Workspace organizzazione (admin)",
  "get admin/organizations/{organizationId}/staff":
    "Staff organizzazione (admin)",
  "get admin/organizations/{organizationId}/students":
    "Studenti organizzazione (admin)",
  "get admin/organizations/{organizationId}/didactics":
    "Didattica organizzazione (admin)",
  "get admin/organizations/{organizationId}/stats":
    "Statistiche organizzazione (admin)",
  "get admin/organizations/{organizationId}/classes/{classId}":
    "Dettaglio classe (admin)",
  "post admin/organizations/{organizationId}/users": "Creazione utente (admin)",
  "put admin/organizations/{organizationId}/users/{userId}":
    "Modifica utente (admin)",
  "delete admin/organizations/{organizationId}/users/{userId}":
    "Eliminazione utente (admin)",
  "post admin/organizations/{organizationId}/import-students":
    "Import massivo studenti (admin)",
  "post admin/organizations/{organizationId}/classes": "Creazione classe (admin)",
  "post admin/organizations/{organizationId}/subjects": "Creazione materia (admin)",
  "post admin/organizations/{organizationId}/assignments":
    "Creazione assegnazione (admin)",
  "get admin/knowledge-source": "Elenco documenti knowledge base",
  "post admin/knowledge-source/save": "Salvataggio documento knowledge base",
  "post admin/knowledge-source/upload": "Caricamento documento knowledge base",
  "patch admin/knowledge-source/{id}": "Modifica documento knowledge base",
  "delete admin/knowledge-source/{id}": "Eliminazione documento knowledge base",
  "get admin/surveys": "Elenco questionari (admin)",
  "get admin/surveys/{surveyId}": "Dettaglio questionario (admin)",
  "get admin/surveys/{surveyId}/responses": "Risposte questionario (admin)",
  "post admin/surveys": "Creazione questionario (admin)",
  "put admin/surveys/{surveyId}": "Modifica questionario (admin)",
  "get admin/logs": "Consultazione log attività",
  "get admin/logs/cost-summary": "Riepilogo costi AI",
  "get admin/logs/export": "Export dei log",
};

/** Eventi non-HTTP (ai/client/system): la `action` è già semantica. */
const SEMANTIC_LABELS: Record<string, string> = {
  // Telemetria client
  "material.open": "Apertura materiale",
  "material.download": "Download materiale",
  "voice.session": "Sessione vocale",
  "navigation": "Navigazione",
  // Eventi sistema
  "admin.logs_export": "Export dei log",
  // Chiamate AI (token reali)
  "ai.material_generate": "Generazione materiale (AI)",
  "ai.conversation_title": "Titolo conversazione (AI)",
  "ai.chat_response": "Risposta chat (AI)",
  "ai.help_chat": "Chat di assistenza (AI)",
  "ai.embed_document": "Vettorizzazione documento (AI)",
  "ai.embed_query": "Vettorizzazione query (AI)",
  "ai.attempt_insight": "Insight tentativo (AI)",
  "ai.test_insight": "Insight test (AI)",
  "ai.student_insight": "Insight studente (AI)",
  "ai.correct_student_question": "Correzione risposta (AI)",
};

/** Fallback: umanizza una chiave/route non mappata (mai user input). */
const humanize = (value: string): string => {
  const cleaned = value
    .replace(/^(get|post|put|patch|delete|options)\s+/i, "")
    .replace(/\{[^}]+\}|:[a-zA-Z]+/g, "") // rimuove i parametri di path
    .replace(/[/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return value;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/**
 * Etichetta leggibile per un evento. Passare method+route per gli eventi HTTP
 * (lookup robusto cross-ambiente); per ai/client/system basta la `action`.
 */
export const labelForAction = (
  action: string,
  method?: string | null,
  route?: string | null,
): string => {
  if (SEMANTIC_LABELS[action]) return SEMANTIC_LABELS[action];

  const key =
    method || route ? normalizeKey(method, route) : action.toLowerCase().trim();
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];

  // L'action HTTP potrebbe già essere nel formato "metodo /route"
  const fromAction = ACTION_LABELS[action.toLowerCase().trim()];
  if (fromAction) return fromAction;

  return humanize(route || action);
};
