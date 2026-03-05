# 🌐 Specifica UI/UX: Dashboard SuperAdmin (Global View)

**Target**: Team Tecnico / Proprietari della piattaforma.
**Obiettivo**: Monitoraggio multi-tenant, scalabilità e stima costi AI.
**Fonte Dati AI**: Collezione `file_embeddings` (handouts/dispense con embedding).

---

## 1. Global KPI Cards (Stato dell'Impero)
- **Total Organizations**: Conteggio totale nella collezione `organizations`.
- **Global Users**: Totale utenti attivi nel sistema.
- **AI Knowledge Base Size**: Numero totale di "pezzi" (chunks) indicizzati nel database vettoriale.
- **Estimated Total Tokens**: Somma stimata dei token generati globalmente.

---

## 2. Monitoraggio Consumi AI & Token (Basato sulla nuova collezione)
Dato che ogni documento ha un campo `text`, possiamo stimare i token usati per l'indicizzazione.

### Logica di Calcolo per Antigravity:
Per ogni organizzazione, calcolare:
1. **Token Indexing**: `sum(length(text) / 4)` (approssimazione standard: 1 token ogni 4 caratteri) su tutti i documenti legati ai docenti di quell'org.
2. **Storage Embedding**: Numero di vettori presenti (array `embedding`). Ogni vettore ha un costo di storage.
3. **Top "Data Eaters"**: Classifica delle Organizzazioni che occupano più spazio/token (utile per il billing).

---

## 3. Multi-Tenant Overview (Tabella Comparativa)
Una tabella che elenca tutte le organizzazioni con:
- **Nome Org** | **Utenti** | **Documenti Caricati** | **Token Stimati** | **Stato Onboarding**.
- Azione: Tasto "Login as Admin" per vedere la dashboard specifica di quella Org.

---

## 4. Analisi Tecnica Documenti
Sfruttando la struttura del JSON fornito:
- **Materia più "pesante"**: Quale materia (es. "Scienze Nautiche") ha più materiale testuale?
- **Docenti più attivi**: Chi sta caricando più dispense (tramite `teacher_id`)?
- **Rapporto Testo/Embedding**: Monitorare se ci sono documenti troppo lunghi che potrebbero frammentare troppo il database vettoriale.

---

## 🛠️ Regole UI & Implementazione
- **Visualizzazione**: Grafici a barre per il confronto tra organizzazioni.
- **CSS**: Usa le variabili di `styles.css` per i colori degli alert (es. se un'org supera una certa soglia di token, colora la riga di rosso).
- **Relazione Dati**: Per raggruppare per Organizzazione, Antigravity deve fare un `$lookup` tra:
  `knowledge_base.teacher_id` -> `users._id` -> `users.organizationId`.