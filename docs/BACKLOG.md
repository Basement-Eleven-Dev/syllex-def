# Backlog — lavori da fare

> Lista unica del lavoro rimasto, ogni voce dice **cosa**, **dove** e **perché**.
> Aggiornare questo file quando un item viene completato o se ne aggiungono.
>
> Convenzione: ogni fix/pulizia va su un **branch dedicato** (non accorpare).

---

## 🐞 Bug noti

### 1. Transloco — chiavi grezze nella generazione slide — ✅ RISOLTO (su `feature/logging`, 2026-06-24)

- **Causa REALE:** i blocchi `laboratorio_ai.style_prefills` e `laboratorio_ai.style_instructions` NON esistevano in `it.json`/`en.json` (la nota originale era sbagliata) → `translate()` tornava la chiave perché la chiave mancava, non per timing.
- **Fatto:** aggiunti i due blocchi in `frontend/public/assets/i18n/it.json` ed `en.json`. `style_prefills` = prompt precompilati che l'utente dà all'AI (vengono inseriti nel campo "instructions" inviato al modello), scritti come richieste ("Genera le slide in modo schematico: …"); `style_instructions` = direttiva di stile rinforzata, appesa al prompt in `onGenerate`.
- **Migliorie aggiunte (2026-06-24):**
  - **Prompt più ricchi:** `style_prefills` ora sono prompt di alcune righe, funzionali (densità, tono, scopo).
  - **Lo stile arriva DAVVERO a Gamma:** prima `textOptions.amount` era hardcoded "medium". Ora il frontend invia `slideStyle` e il backend (`createAiGenMaterial.ts`) lo mappa su `amount` (schematica→brief, bilanciata→medium, descrittiva→detailed). Lo stile incideva solo sul testo dell'LLM, ora anche sulla densità del deck.
  - **Traduzione reattiva:** label (computed) e prefill ora si ri-traducono al cambio lingua via evento transloco `langChanged` (signal `i18nVersion`); il prefill si ri-traduce solo se non editato dall'utente. (Il tentativo precedente usava l'evento sbagliato `translationLoadSuccess` → regressione, ora corretto.)
- **Da verificare a runtime:** wizard slide IT/EN — label e prefill nella lingua giusta e che cambiano col selettore lingua; generazione con densità Gamma coerente allo stile.

### 2. N+1 chiamate "attempt" al login studente — ✅ RISOLTO (su `feature/logging`, 2026-06-24)

- **Sintomo era:** dashboard e lista test scatenavano una `GET test/{testId}/attempt` per ogni test (cascata, fino a centinaia di chiamate → log gonfiati).
- **Fatto:** nuovo endpoint batch `POST attempts/batch` (`backend/src/functions/students/tests/getStudentAttemptsBatch.ts`, role student) che ritorna in 1 query il tentativo più recente per una lista di testId, con payload leggero (solo status/score/maxScore + questions{score,points,status}, niente populate). Service: `getAttemptsByTestIds()` in `student-tests.service.ts`. Aggiornati `student-dashboard.ts` e `student-tests-list.ts` (1 sola chiamata, stessa logica stati/score, error handler aggiunto). L'endpoint singolo `getStudentAttempt` resta per esecuzione/revisione.
- **Da verificare a runtime:** login studente → dashboard e lista test mostrano stati e punteggi corretti; filtri "Da fare"/"Autovalutazioni" invariati.

### 3. Polling 1Hz dei messaggi durante le sessioni vocali — ✅ RISOLTO (su `feature/logging`, 2026-06-24)

- **Sintomo era:** durante la voce, una `GET messages` al secondo verso Mongo anche senza novità (`setInterval(1000)` in `agent-chat.ts`).
- **Causa reale:** il polling serviva solo a "ridare l'`_id`" ai messaggi vocali aggiunti in locale senza `_id` (l'`_id` serve al TTS dopo l'uscita dalla voce).
- **Fatto:** `saveVoiceMessage()` ora prende l'`_id` dalla risposta di `saveLiveMessage()` e patcha il messaggio locale; rimossi `setInterval`/`startPollingMessages`/`stopPollingMessages`. Il reload finale `initializeChatHistory()` all'uscita dalla voce resta come rete di sicurezza. Da ~60 GET/min per sessione → 0.
- **Da verificare a runtime:** sessione vocale → 2-3 scambi → passa a testo (messaggi tutti presenti e in ordine, "Ascolta"/TTS funziona) → torna in voce (contesto mantenuto).

### 4. Ordine messaggi chat rotto dopo voce→testo + salvataggi lentissimi — ✅ RISOLTO (su `feature/logging`, 2026-06-24)

- **Sintomo era:** dopo una sessione vocale, ricaricando la chat i messaggi apparivano tutti gli AI sopra e tutti gli utente sotto; inoltre `messages/save` arrivava a 30s+.
- **Causa:** in `saveMessage` il `timestamp` veniva assegnato all'insert, DOPO l'`await` della generazione AI del titolo (lenta). I messaggi utente (primi 3 turni) venivano rallentati e ricevevano un timestamp posteriore agli AI → `buildConversationHistory` (sort by timestamp) li metteva in fondo.
- **Fatto:** in `backend/src/_helpers/DB/messages/saveMessage.ts` il timestamp è catturato a inizio funzione e la generazione AI del titolo è stata RIMOSSA dal salvataggio.
- **Cronologia/sidebar (stessa area, fatto):** `listConversations` ora ordina per timestamp prima del group e ricava il titolo dal **primo messaggio dell'utente** (troncato), ignorando i vecchi titoli AI salvati (es. "Saluto iniziale" su una chat poi diventata altro). Il frontend (`agent-chat.ts`) aggiorna la sidebar (`refreshConversations()`) dopo il primo messaggio testo e all'uscita dalla voce → la conversazione appena iniziata compare senza ricaricare la pagina.
- **Da verificare a runtime:** hard refresh → sessione voce + testo mista → ordine cronologico corretto, salvataggi rapidi, nuova conversazione visibile subito in cronologia col titolo = prima richiesta dell'utente.

---

## 🧹 Pulizie / codice morto

- **Titolo conversazione AI ora codice morto:** dopo il fix #4, `backend/src/_helpers/AI/generateConversationTitle.ts` (`generateConversationSummaryTitle`, `generateConversationTitleGemini`) non è più chiamato (c'è anche un duplicato `generateConversationTitleGemini` in `generateResponse.ts:249`). Decidere: rimuoverlo, **oppure** riusarlo per rigenerare i titoli AI in modo NON bloccante (endpoint dedicato chiamato fire-and-forget dal client, fuori dal hot path del salvataggio) se si vogliono i titoli "smart" in sidebar.

- **Impersonation:** rimuovere `x-impersonate-user` in `getAuthCognitoUser.ts` (era per test).
- **Lambda non instradate** (mai esposte in `functions-declarations.config.ts`): `countPublishedTests`, `getStudents`, `updateSettings`, `executeTest`, `listenTomessage` → rimuovere.
- **Ramo OpenAI/TTS morto:** `whisper/generateAudio.ts` + `listenTomessage.ts` (TTS sperimentale) → rimuovere. Produzione 100% Gemini.
- **File orfani root backend:** `int`, `geminidoc.md` (vuoti), eventuale `import_utente_marina.ts`.
- **Routine `routines/temp-seeding/`** (seed usa-e-getta) → rimuovere.
- **Migrazione modello:** convivono ancora `gemini-3-flash-preview` e `gemini-3.1-flash-lite` → completare l'allineamento a un solo modello.

---

## 📊 Logging / audit — rifiniture rimaste

Il sistema di logging è implementato e funzionante (cattura HTTP automatica, costi
AI reali, telemetria client, pagina `/a/logs`, vocabolario azioni, export
CSV/JSON/descrittivo). Restano:

- **Eventi asincroni in produzione:** aggiungere il log in `backgroundVectorize.ts` (vettorizzazione ok/ko) e `sendEmailTrigger.ts` (email inviata/fallita). In locale girano sincroni dentro l'HTTP (già loggato); in produzione passano da SQS e oggi non sono coperti.
- **Analisi flussi/funnel** (dove si bloccano gli utenti) sopra i dati già raccolti.
- **Ripulire i log pre-24/06** (opzionale): record con "utente sconosciuto" e durata 0 generati prima del fix `enterWith → storage.run`.
- **A scala (quando il volume cresce):** valutare un TTL/retention sulla collection `activity_logs` e ridurre il rumore ad alta frequenza (health check, poll messaggi) per contenere indici e storage.
- **Filtro date in ora locale** (opzionale): oggi i confini giornata sono in UTC; per la semantica "giornata italiana" esatta far inviare al frontend gli ISO completi in ora locale.
- ✅ **Leggibilità log — FATTO (2026-06-24):** `/a/logs` ridisegnata — viste segmentate (Tutto / Solo azioni utente=`category client` / AI / Errori), preset temporali (Ultima ora/Oggi/7gg/Tutto) + range custom con data e ora, ora prominente in tabella, statistiche in chip, dettaglio costi collassabile, paginazione "Carica altri" (50/volta, più recenti in cima), riga espandibile col dettaglio tecnico.
- ✅ **Stop logging `/telemetry` — FATTO (2026-06-24):** `activityLogger.ts` non scrive più la riga http per la route `telemetry` (gli eventi client restano).
- **Cache profilo/organizzazione in navigazione:** ogni navigata su `/s/tests` ricarica anche `Consultazione profilo` e `Dettaglio organizzazione` → caricarli una volta e cacharli (meno chiamate, meno rumore nei log).
- **Super-admin senza email nei log (`utente sconosciuto (admin)`):** le richieste del super-admin (email reale `giulia@convivostudio.it`) loggano il ruolo ma non `userEmail` → verificare come è stato creato quell'utente admin (probabilmente manca `email` sul record o è su un altro campo) o se il middleware non la risolve per quel ruolo. Emerso dall'export del 2026-06-24.
- **`Accettazione delle policy` a ogni accesso — probabilmente NON un bug:** appariva perché si stava testando in scheda in incognito (sessione fresca → accettazione legittima). Da verificare SOLO se ricapita in una sessione normale (utente che ha già accettato).

---

## 📑 Compliance / legale (AI Act + GDPR)

> Non è parere legale: da far validare a un DPO / legale, soprattutto per i clienti enti pubblici.
> 📂 **Dettaglio e razionale: [`docs/compliance/`](compliance/README.md)** (mappa "dove siamo parati").

**Fatto (2026-06-25):**
- ✅ **Log contenuti AI** (input/output) per indagini, con minimizzazione (no documenti, cap 50k, voce esclusa) → `docs/compliance/logging-contenuti-gdpr.md`.
- ✅ **Trasparenza AI Act §1a — materiali**: marcatore "Generato con AI" reso esplicito (stellina + tooltip + `aria-label`) su `materiale-card`.
- ✅ Chiarito **perché non siamo "alto rischio"**: valutazione assistita con finalizzazione umana (esenzione Art. 6(3)) → `docs/compliance/ai-act.md`.
- ✅ **Informativa aggiornata nei Termini** (docente + studente): chat/voce = AI, correzione assistita con validazione umana, logging contenuti AI per sicurezza; `TERMS_VERSION` 1.0 → **1.1** (ri-mostra il modale a tutti).
- ✅ **Disclosure in-app chat/voce** (Art. 50 al punto di interazione): badge "AI" + sottotitolo esplicito nella chat, avviso "stai parlando con un'AI" sotto l'orb vocale (`agent-chat`, copre docente e studente).

**Da fare:**
- [ ] ⚠️ **TTL 24 mesi** sui campi contenuto dei log (preferibile `$unset` schedulato, non TTL index) → `docs/compliance/logging-contenuti-gdpr.md` §4.
- [ ] **Nota Art. 6(4)** ("non è alto rischio"), **LIA**, **DPIA**: documenti interni da redigere → `docs/compliance/`.
- [ ] **ROPA (Art. 30)** e **DPA con gli enti (Art. 28)**: Syllex responsabile, ente titolare.

> Nota: l'app **non** è accessibile ai minori (dichiarato dal titolare) → è ciò che consente il logging contenuti generalizzato; se cambiasse, rivedere LIA/DPIA.
