# AI Act — Trasparenza e classificazione del rischio

> Dove e come rispettiamo l'AI Act (Reg. UE 2024/1689). Due temi: **trasparenza**
> (Art. 50, dire che c'è un'AI) e **classificazione del rischio** (perché Syllex
> non è un sistema "alto rischio" pur valutando apprendimento).
>
> ⚠️ Ricostruzione tecnica, non consulenza legale. Vedi [README.md](README.md).

---

## 1. Trasparenza (Art. 50)

L'Art. 50 chiede di **informare le persone** quando: (1) interagiscono con un'AI,
e (2) un contenuto è generato/manipolato dall'AI. Tempistica: gli obblighi di
trasparenza si applicano da **~agosto 2026**.

### 1a. Contenuti generati dall'AI → marcatore sul materiale

I materiali generati (slide, riassunti, glossari, mappe) sono marcati con la
**stellina-Gemini + tooltip "Generato con l'intelligenza artificiale"**.

- **Dove:** `frontend/src/teacher/components/materiale-card/materiale-card.html`
  (blocco `@if (isAIGenerated && showAiBadge)`), classe `.ai-generated-icon` in
  `materiale-card.scss`, import `NgbTooltip` in `materiale-card.ts`.
- **Testo:** chiave i18n `materiali.card.ai_generated` in `it.json` / `en.json`.
- **Sorgente del flag:** campo `aiGenerated` sul materiale (settato a `true` in
  `backend/src/functions/ai/createAiGenMaterial.ts`).
- **Perché basta:** la stellina è il segno riconosciuto per "AI"; ora è resa
  esplicita (visibile + spiegata a parole + accessibile via `aria-label`), non più
  solo decorativa.

### 1b. Interazione con l'agente conversazionale (chat / voce)

Dove un utente *conversa* con l'AI (agente testuale e voce Gemini Live), va indicato
che è un assistente AI.

- **Integrato (2026-06-25) — nei Termini:** "L'assistente in chat e il tutor vocale sono
  sistemi di Intelligenza Artificiale" (docente: `terms-teacher-content.component.html`
  §Utilizzo dell'IA; studente: `terms-student-content.component.html`, primo bullet).
- **Integrato (2026-06-25) — al punto di interazione (in-app):** disclosure mostrata
  *mentre* si usa l'AI, che è la forma più forte richiesta dall'Art. 50 ("al più tardi al
  momento della prima interazione"). File: `frontend/src/teacher/components/agent-chat/`:
  - **Chat testo:** sottotitolo di benvenuto reso esplicito ("…Assistente Didattico
    Personale basato sull'intelligenza artificiale", chiave i18n `agent_chat.welcome_subtitle`)
    + badge **"AI"** (`app-syllex-badge`, viola) accanto al nome "Alex" con tooltip
    `agent_chat.ai_badge_tooltip`.
  - **Voce:** riga "Stai parlando con un assistente di intelligenza artificiale" sotto
    l'orb vocale (chiave `agent_chat.voice_ai_notice`), visibile durante la sessione.
  - Lo stesso componente serve docente e studente → copre entrambi i ruoli.

### 1c. Valutazione assistita → NON la segnaliamo allo studente in UI

Il fatto che la correzione dei tentativi sia **assistita** dall'AI **non** viene
mostrato come elemento UI sul voto (scelta voluta: poco elegante e non obbligatorio).
È dichiarato nel **testo dei Termini/informativa** accettati al login.

- **Integrato (2026-06-25):** i Termini ora dichiarano esplicitamente che la correzione
  automatica è un **supporto soggetto a verifica e validazione finale del docente**
  (docente: §Utilizzo dell'IA; studente: bullet "verificata e finalizzata da un docente").
  Questo copre la trasparenza *e* mette nero su bianco il razionale dell'esenzione (§2).

- **Perché possiamo evitarlo:** vedi §2 — non essendo "alto rischio" e con decisione
  umana finale, non scatta l'art. 22 GDPR (decisioni *solo* automatizzate). Resta solo
  l'obbligo generale di trasparenza, soddisfatto nell'informativa.

---

## 2. Classificazione del rischio — perché NON siamo "alto rischio"

L'**Allegato III §3** dell'AI Act marca come *alto rischio* i sistemi AI usati per
**"valutare i risultati dell'apprendimento"**. Syllex corregge/valuta i tentativi
degli studenti con l'AI (`aiMarkers`/scoring) → in astratto rientrerebbe.

### L'esenzione che ci salva (Art. 6(3))

Un sistema **non** è alto rischio se **migliora/assiste un'attività umana senza
sostituire o influenzare la decisione finale senza revisione umana**.

In Syllex: **il docente valida sempre la correzione AI** con un gesto esplicito
("finalizza correzione"), oggi una domanda per volta, in futuro l'intero test in un
click — ma **sempre dietro conferma consapevole del docente**. La decisione finale
sul voto è umana. → rientriamo nell'esenzione.

### Due paletti da rispettare per restare nell'esenzione

1. **Niente rubber-stamping.** Il gesto di finalizzazione deve restare una conferma
   *vera* (il docente vede i voti suggeriti e li approva). Se "finalizza tutto il test"
   diventasse un invio automatico senza che il docente guardi nulla, l'esenzione si
   indebolisce. → mantenere sempre il gate esplicito di finalizzazione.
2. **Documentare la valutazione (Art. 6(4)).** Anche quando si conclude "non è alto
   rischio", la norma chiede di **tenere traccia del perché**. → vedi TODO sotto.

### TODO documentale

- [ ] Redigere la **nota Art. 6(4)** ("perché Syllex non è alto rischio"): mezza pagina
      interna che riassume l'esenzione + i due paletti qui sopra. Da far validare al DPO.
      (Non è una pagina dell'app: è un documento interno, vive qui in `docs/compliance/`.)

---

## Dove vivono i documenti (chiarimento)

- **In-app (utente):** marcatori AI sui materiali, disclosure agente, testo nei Termini.
- **Interni (team/DPO/ente):** questo file, la nota Art. 6(4), DPIA e LIA
  (vedi [logging-contenuti-gdpr.md](logging-contenuti-gdpr.md)). Non si renderizzano mai
  nell'app: si consultano dal repo o si esibiscono su richiesta.
