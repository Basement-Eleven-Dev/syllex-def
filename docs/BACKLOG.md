# Backlog — lavori da fare

> Lista unica del lavoro rimasto, ogni voce dice **cosa**, **dove** e **perché**.
> Aggiornare questo file quando un item viene completato o se ne aggiungono.
>
> Convenzione: ogni fix/pulizia va su un **branch dedicato** (non accorpare).

---

## 🐞 Bug noti

### 1. Transloco — chiavi grezze nella generazione slide

- **Dove:** `frontend/src/teacher/pages/laboratorio-ai/laboratorio-ai.ts` (~righe 254, 290, 315, 345). Le chiavi corrette esistono in `frontend/public/assets/i18n/it.json` ed `en.json` (blocco `laboratorio_ai`, ~righe 1197/1202).
- **Sintomo:** nel flusso "come vuoi le tue slide" si vedono/inviano chiavi grezze (`laboratorio_ai.style_prefills.bilanciata`) invece del testo tradotto.
- **Causa:** `translocoService.translate()` sincrono ritorna la chiave se la traduzione non è ancora caricata.
- **Fix:** prima provare hard refresh / restart dev server (possibile cache vecchio `it.json`); se persiste usare `selectTranslate()` o garantire il load prima della lettura.
- **Perché:** difetto visibile all'utente in un flusso delicato (testare la generazione slide end-to-end).

### 2. N+1 chiamate "attempt" al login studente — ✅ RISOLTO (su `feature/logging`, 2026-06-24)

- **Sintomo era:** dashboard e lista test scatenavano una `GET test/{testId}/attempt` per ogni test (cascata, fino a centinaia di chiamate → log gonfiati).
- **Fatto:** nuovo endpoint batch `POST attempts/batch` (`backend/src/functions/students/tests/getStudentAttemptsBatch.ts`, role student) che ritorna in 1 query il tentativo più recente per una lista di testId, con payload leggero (solo status/score/maxScore + questions{score,points,status}, niente populate). Service: `getAttemptsByTestIds()` in `student-tests.service.ts`. Aggiornati `student-dashboard.ts` e `student-tests-list.ts` (1 sola chiamata, stessa logica stati/score, error handler aggiunto). L'endpoint singolo `getStudentAttempt` resta per esecuzione/revisione.
- **Da verificare a runtime:** login studente → dashboard e lista test mostrano stati e punteggi corretti; filtri "Da fare"/"Autovalutazioni" invariati.

### 3. Polling 1Hz dei messaggi durante le sessioni vocali

- **Dove:** `frontend/src/teacher/components/agent-chat/agent-chat.ts` → `startPollingMessages()` (~504), start ~484 / stop ~473; chiama `agentService.getConversationHistory()` (= `GET messages?conversationId=...`, in `frontend/src/services/agent.service.ts`).
- **Sintomo:** durante la voce, una `GET messages` **al secondo** verso Mongo anche senza novità.
- **Fix (idee da validare):** pollare solo dopo un turno completato (esistono `turnCompleteEvent`/`userTurnCompleteEvent` in `gemini-live-service.ts`) invece che a intervallo fisso; backoff; stop quando l'ultimo messaggio locale ha già `_id`.
- **⚠️ Attenzione massima:** il flusso chat **testo/voce** va prima ANALIZZATO e CAPITO, poi ottimizzato con estrema cautela — è intricato (WebSocket Gemini Live, trascrizioni input/output, turni, salvataggio asincrono `saveLiveMessage`/`messages/save`, allineamento messaggi locali↔DB). Non rompere nulla. Testare una sessione vocale end-to-end.
- **Perché:** spreco di risorse e log gonfiati.

---

## 🧹 Pulizie / codice morto

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

---

## 📑 Compliance / legale (sistema di logging AI)

> Non è parere legale: da far validare a un DPO / legale, soprattutto per i clienti enti pubblici.

- **Base giuridica + retention** del trattamento "log attività" da formalizzare (legittimo interesse / obbligo legale; la retention illimitata va giustificata o limitata).
- **Informativa privacy:** aggiungere il paragrafo sui log di attività (metadati raccolti, finalità, durata, diritti).
- **Registro dei trattamenti (ROPA, Art. 30):** inserire la voce.
- **DPA con gli enti (Art. 28):** Syllex è responsabile del trattamento, l'ente è titolare.
- **DPIA:** probabilmente necessaria (AI alto rischio in ambito educativo + dati di **minori**).
- **Avviso di trasparenza AI (Art. 50):** indicare nell'interfaccia che chat e tutor vocale sono AI.
