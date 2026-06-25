# Logging dei contenuti AI — cosa salviamo, perché, e il TODO sul TTL

> Il sistema di audit (`activity_logs`) ora salva anche **input e output delle
> chiamate AI server-side**, per poter indagare contenuti illeciti/anomali generati
> fuori dalla chat. Qui: cosa salviamo, la base giuridica, chi accede, e il
> **TTL ancora da implementare**.
>
> ⚠️ Ricostruzione tecnica, non consulenza legale. Vedi [README.md](README.md).

---

## 1. Cosa salviamo (e cosa NON salviamo)

Catturato in un unico punto di strozzatura: `backend/src/_helpers/AI/trackedGeneration.ts`
(wrapper attorno a ogni `generateContent` Gemini).

**Salviamo** (campi `promptContent`, `responseContent`, `finishReason` su `activity_logs`):

- il **prompt testuale** inviato al modello (istruzioni di sistema + istruzioni utente);
- la **risposta testuale** del modello;
- il `finishReason` (es. `STOP`, `SAFETY`) per capire output vuoti/bloccati.

**NON salviamo** (minimizzazione dei dati — argomento forte per LIA/DPIA):

- i **documenti allegati** (le dispense/PDF passati come `inlineData` base64): esclusi
  apposta da `extractPromptText()`, restano referenziati solo via `materialId`;
- contenuto oltre il **cap di 50.000 caratteri** per campo (troncato con marcatore);
- la **voce realtime** (Gemini Live): è client-side, il backend emette solo il token →
  quel contenuto resta nei `messages` (`saveLiveMessage`), non in `activity_logs`;
- gli **embedding**: lasciati metadati-only (output = vettore, inutile da ispezionare).

**Copertura:** ogni generazione testuale server-side — materiali, insight, RAG, chat-testo.

### File coinvolti

- Cattura: `backend/src/_helpers/AI/trackedGeneration.ts`
- Propagazione: `backend/src/_helpers/logging/requestContext.ts` (tipo `AiUsageEvent`) →
  `backend/src/_helpers/logging/activityLogger.ts` (flush) →
  `backend/src/models/schemas/activity-log.schema.ts` (campi a DB)
- Lettura (super-admin): `backend/src/functions/admin/logs/getActivityLogs.ts`,
  UI in `frontend/src/app/admin/pages/admin-logs/` (dettaglio riga espandibile)

---

## 2. Base giuridica e finalità

- **Finalità:** sicurezza della piattaforma e indagine su contenuti illeciti/anomali
  generati tramite l'AI; tracciabilità a fini di audit.
- **Base giuridica (GDPR Art. 6):** **legittimo interesse** (Art. 6(1)(f)) — sicurezza e
  integrità del servizio — e/o adempimento di obblighi (tracciabilità AI Act).
- **Minori:** l'app **non** è accessibile ai minori (dichiarato dal titolare). Questo è
  ciò che ci permette il logging dei contenuti generalizzato; se cambiasse, va rivisto.

### Informativa — ✅ integrata nei Termini (2026-06-25)

Il testo accettato al login ora dichiara il trattamento. Aggiunto in entrambi i contenuti,
sezione **Protezione dei dati personali**:

- **Docente** (`frontend/src/app/policy-acceptance-modal/terms-teacher-content.component.html`):
  paragrafo su finalità di sicurezza/prevenzione abusi/verifica contenuti illeciti,
  conservazione del contenuto delle interazioni AI (richieste + risposte), base giuridica
  legittimo interesse, accesso al solo personale autorizzato, retention limitata.
- **Studente** (`terms-student-content.component.html`): versione semplificata equivalente.
- **Versionamento:** `TERMS_VERSION` portato da `1.0` → **`1.1`**
  (`frontend/src/app/_utils/terms-version.ts`) → `app.ts` ri-mostra il modale di
  accettazione a tutti gli utenti.

> Nota: nei Termini la retention è indicata come "periodo limitato" (non un numero), così il
> testo non va ri-bumpato quando si fissa/cambia il TTL tecnico. Il valore operativo (24 mesi)
> vive qui sotto e nel codice.

### TODO documentale

- [ ] **LIA** (valutazione del legittimo interesse): mezza paginetta che bilancia il
      nostro interesse (sicurezza) vs i diritti degli interessati. Argomenti a favore:
      minimizzazione (no documenti, cap 50k), accesso ristretto, finalità di sicurezza.
- [ ] **DPIA**: probabilmente dovuta (AI + monitoraggio sistematico dei contenuti).
      Riusare gli stessi argomenti di minimizzazione/accesso.
- [ ] Entrambi sono **documenti interni** (qui in `docs/compliance/`), non pagine app.

---

## 3. Chi accede e come esce dal sistema

- **In-app:** solo **super-admin**, pagina `/a/logs`. Il contenuto compare nel dettaglio
  riga espandibile dell'evento `ai`.
- **Export (`getLogsExport.ts`):** sicuro by-design rispetto al contenuto —
  - **CSV** e **report descrittivo** (i formati pensati per gli enti): colonne/campi
    whitelistati, **senza** contenuto → restano solo-metadati;
  - **JSON grezzo** (solo super-admin): include il contenuto via spread dei documenti.
- **Meta-audit:** ogni export scrive un evento `admin.logs_export` (chi/cosa/quando).

---

## 4. Retention / TTL — ⚠️ DA IMPLEMENTARE (target 24 mesi)

**Stato attuale:** i log non hanno scadenza (nessun TTL). Per i *metadati* è accettabile;
per i **contenuti** (`promptContent`/`responseContent`) "li teniamo per sempre" è difficile
da giustificare e indebolisce LIA/DPIA.

**Decisione presa:** retention dei contenuti a **24 mesi**. **Non ancora implementata** —
promemoria esplicito per non dimenticarla.

### Come implementarlo (quando ci si mette mano)

Opzioni, da valutare:

1. **Azzeramento selettivo dei soli campi contenuto** dopo 24 mesi (mantiene i metadati
   per le statistiche/costi): job schedulato che fa `$unset` di `promptContent`/
   `responseContent` sui documenti `category: "ai"` più vecchi di 24 mesi.
   → **Preferibile**: conserva l'audit metadati, scarta solo il contenuto sensibile.
2. **TTL index Mongo** su un campo data: cancella l'**intero** documento dopo 24 mesi.
   → Più semplice ma perde anche i metadati (costi/statistiche storiche).

> ⚠️ Attenzione: un TTL index cancella dati in modo automatico e irreversibile. Da
> introdurre con cautela e solo dopo aver deciso se vogliamo perdere anche i metadati
> (opzione 2) o solo il contenuto (opzione 1, consigliata).

- **Dove:** schema `backend/src/models/schemas/activity-log.schema.ts` (commento TODO già
  presente vicino ai campi contenuto) + un job/routine schedulata per l'opzione 1.

---

## Collegamenti

- Trasparenza e classificazione rischio: [ai-act.md](ai-act.md)
- Indice e TL;DR: [README.md](README.md)
- Backlog team: `docs/BACKLOG.md`
