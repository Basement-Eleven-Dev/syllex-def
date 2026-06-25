import { InferSchemaType, model, Schema } from "mongoose";

/**
 * activity_logs — fonte di verità unica e interrogabile su ogni azione nell'app.
 *
 * Documento POLIMORFICO: i campi si popolano in base alla `category`.
 * - `http`   → una richiesta a una delle Lambda (chi/cosa/quando/durata/esito)
 * - `ai`     → una singola chiamata a un modello Gemini (token reali)
 * - `system` → eventi asincroni non-HTTP (vettorizzazione, email) — Fase 2
 * - `client` → telemetria dal browser (voce, apertura materiali) — Fase 2
 *
 * Nessun contenuto sensibile qui dentro: solo metadati e riferimenti.
 * Il costo NON si salva: si calcola a lettura (token x tariffa modello).
 */
const activityLogSchema = new Schema(
  {
    // --- CHI ---
    userId: { type: Schema.Types.ObjectId },
    userEmail: { type: String },
    userRole: { type: String },
    organizationId: { type: Schema.Types.ObjectId },
    subjectId: { type: Schema.Types.ObjectId },

    // --- COSA ---
    category: {
      type: String,
      enum: ["http", "ai", "system", "client"],
      required: true,
    },
    action: { type: String, required: true }, // etichetta leggibile (es. "POST /ai/materials")
    functionName: { type: String },
    route: { type: String },
    httpMethod: { type: String },
    payload: { type: Schema.Types.Mixed }, // solo metadati (es. { materialType: "slides" })

    // --- QUANDO / DURATA ---
    startedAt: { type: Date, required: true },
    durationMs: { type: Number },

    // --- ESITO (debug) ---
    status: { type: String, enum: ["success", "error"] },
    httpStatusCode: { type: Number },
    errorType: { type: String },
    errorMessage: { type: String },
    rateLimited: { type: Boolean },
    retryCount: { type: Number },

    // --- COSTO (solo eventi AI) ---
    model: { type: String },
    modality: { type: String }, // text | audio | image | embedding
    inputTokens: { type: Number },
    outputTokens: { type: Number },
    cachedTokens: { type: Number },
    totalTokens: { type: Number },

    // --- CONTENUTO AI (solo eventi 'ai', per indagini su materiale illecito/anomalo) ---
    // Catturato al chokepoint trackedGenerateContent: copre ogni generazione
    // server-side FUORI dalla chat (materiali, insight, RAG) e anche la chat-testo.
    // La voce realtime (Gemini Live) NON passa di qui → resta nei `messages`.
    // Solo testo, documenti allegati esclusi, troncato a 50k caratteri.
    // TODO compliance: retention 24 mesi sui SOLI campi contenuto (preferibile un
    // $unset schedulato, non un TTL index che cancella anche i metadati).
    // Razionale e opzioni: docs/compliance/logging-contenuti-gdpr.md §4.
    promptContent: { type: String },
    responseContent: { type: String },
    finishReason: { type: String }, // STOP | MAX_TOKENS | SAFETY | …

    // --- CORRELAZIONE ---
    traceId: { type: String }, // lega tutti gli eventi della stessa azione utente
    requestId: { type: String }, // l'invocazione Lambda
    conversationId: { type: String },
    materialId: { type: Schema.Types.ObjectId },
    attemptId: { type: Schema.Types.ObjectId },
    testId: { type: Schema.Types.ObjectId },

    // --- CONTESTO TECNICO ---
    userAgent: { type: String },
    appVersion: { type: String },
    stage: { type: String },
  },
  {
    // Niente updatedAt: i log sono immutabili. createdAt utile come fallback temporale.
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Indici per le interrogazioni previste (timeline utente, trace, statistiche, errori, costi)
activityLogSchema.index({ userId: 1, startedAt: -1 });
activityLogSchema.index({ traceId: 1 });
activityLogSchema.index({ action: 1, startedAt: -1 });
activityLogSchema.index({ status: 1, startedAt: -1 });
activityLogSchema.index({ category: 1, model: 1, startedAt: -1 });
activityLogSchema.index({ organizationId: 1, startedAt: -1 });

export type ActivityLog = InferSchemaType<typeof activityLogSchema>;

export const ActivityLog = model<ActivityLog>(
  "ActivityLog",
  activityLogSchema,
  "activity_logs",
);
