# Compliance AI Act + GDPR — mappa del "siamo parati"

> A cosa serve questa cartella: spiegare **dove** nel prodotto rispettiamo gli
> obblighi su AI e dati personali e **perché** le scelte fatte ci tengono in regola,
> così che chiunque nel team possa rispondere a un ente/DPO senza ricostruire tutto
> da zero. Linguaggio da team tecnico, non da avvocato.
>
> ⚠️ **Non è una consulenza legale.** È la nostra ricostruzione tecnica ragionata.
> I documenti interni formali (informativa definitiva, DPIA, LIA) vanno validati da
> un DPO/legale. Qui teniamo traccia di cosa abbiamo implementato e del razionale.

---

## I due cantieri (sono distinti, non confonderli)

| | Norma | Riguarda | Dove vive |
|---|---|---|---|
| **Trasparenza** | AI Act, Art. 50 | dire agli utenti che c'è un'AI | nell'**app** (badge/disclosure) + informativa |
| **Dati personali** | GDPR | cosa salviamo e perché (incl. log contenuti AI) | informativa accettata al login + documenti interni |

---

## Indice dei documenti

- **[ai-act.md](ai-act.md)** — Trasparenza (Art. 50) e perché **non** siamo "alto rischio"
  (esenzione Art. 6(3) sulla valutazione assistita). Dice dove sono i marcatori AI nel codice.
- **[logging-contenuti-gdpr.md](logging-contenuti-gdpr.md)** — Cosa salva il sistema di log
  riguardo ai contenuti AI, base giuridica, accesso, export e **il TODO sul TTL a 24 mesi**
  (retention dei contenuti a DB — ancora da implementare).

---

## TL;DR — siamo parati perché…

1. **Marchiamo i contenuti AI**: i materiali generati hanno il marcatore "Generato con AI"
   (stellina + tooltip) e l'agente conversazionale è dichiarato come AI. → Art. 50.
2. **La valutazione è assistita, non automatica**: il docente finalizza sempre la correzione
   con un gesto esplicito. → fuori dall'alto rischio (Allegato III §3) per esenzione Art. 6(3).
3. **Trasparenza nei termini**: l'uso dell'AI è dichiarato nei Termini accettati al login —
   chat/voce = sistemi AI, correzione assistita con validazione umana, e l'informativa sul
   logging dei contenuti AI per sicurezza (Termini portati a `TERMS_VERSION 1.1`, 2026-06-25).
4. **Log a prova di audit, con minimizzazione**: salviamo input/output AI per indagare
   contenuti illeciti, ma solo testo (niente documenti allegati), troncato, accesso super-admin.
   **Manca solo la retention a tempo (TTL)** — vedi il documento dedicato.

## Cosa resta da fare (sintesi, dettagli nei file)

- [ ] **TTL 24 mesi** sui campi contenuto dei log → `logging-contenuti-gdpr.md` §Retention.
- [x] **Testo dell'informativa** (Termini) con la finalità "log contenuti per sicurezza" +
      bump `TERMS_VERSION` a 1.1 → fatto 2026-06-25, vedi `logging-contenuti-gdpr.md` §Informativa.
- [x] Disclosure **in-app** "assistente AI" al punto di interazione chat/voce → fatto
      2026-06-25 (badge "AI" + sottotitolo in chat, avviso sotto l'orb in voce) → `ai-act.md` §1b.
- [ ] Documenti interni formali (**DPIA**, **LIA**, nota **Art. 6(4)** "non è alto rischio")
      da redigere e far validare → riferimenti nei rispettivi file.

> Questi item sono anche linkati dal `docs/BACKLOG.md` per non perderli.
