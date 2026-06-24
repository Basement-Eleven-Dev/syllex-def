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
- **Super-admin senza email nei log (`utente sconosciuto (admin)`):** le richieste del super-admin loggano il ruolo ma non `userEmail` → verificare perché l'utente admin non ha email popolata (schema/Cognito) o se il middleware non la risolve per quel ruolo. Emerso dall'export del 2026-06-24.
- **`Accettazione delle policy` (PATCH profile/policies) a ogni accesso:** compare a ogni landing di docente/studente → verificare se è una scrittura inutile ripetuta a ogni login (dovrebbe avvenire solo quando l'utente accetta davvero) o un'etichetta fuorviante. Possibile chiamata sprecata + rumore nei log.

---

## 📑 Compliance / legale (sistema di logging AI)

> Non è parere legale: da far validare a un DPO / legale, soprattutto per i clienti enti pubblici.

- **Base giuridica + retention** del trattamento "log attività" da formalizzare (legittimo interesse / obbligo legale; la retention illimitata va giustificata o limitata).
- **Informativa privacy:** aggiungere il paragrafo sui log di attività (metadati raccolti, finalità, durata, diritti).
- **Registro dei trattamenti (ROPA, Art. 30):** inserire la voce.
- **DPA con gli enti (Art. 28):** Syllex è responsabile del trattamento, l'ente è titolare.
- **DPIA:** probabilmente necessaria (AI alto rischio in ambito educativo + dati di **minori**).
- **Avviso di trasparenza AI (Art. 50):** indicare nell'interfaccia che chat e tutor vocale sono AI.
