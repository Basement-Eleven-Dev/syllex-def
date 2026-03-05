# 📊 Specifica UI/UX: Dashboard Statistiche Admin (Livello Organization)

**Obiettivo**: Fornire all'Admin dell'organizzazione (es. "Marina Militare") una visione chiara dello stato dei dati e dell'attività didattica.
**Vincolo UI**: Utilizzare esclusivamente `styles.css`. Layout a grid pulito. Niente CSS inline.

---

## 1. Top Row: KPI Cards (Metriche Quick-Look)
Quattro card principali in alto per il conteggio totale (Filtrate per `organizationId`):
- **Totale Studenti**: Conteggio utenti con `role: 'student'`.
- **Totale Docenti**: Conteggio utenti con `role: 'teacher'`.
- **Classi Attive**: Conteggio record nella collezione `classes`.
- **Test Pubblicati**: Conteggio record `tests` con `status: 'pubblicato'`.


## 2. Sezione "Attività Didattica" (Grafici/Liste)
- **Distribuzione Test per Materia**: Un istogramma che mostra quanti test sono stati creati per ogni `subjectId`. Aiuta a capire quali materie sono più avanti col programma.
- **Carico Docenti**: Una lista dei docenti con il numero di classi e materie associate (derivate da `teacher_assignments`).
- **Prossimi Test**: Elenco dei test con `availableFrom` futuro, per monitorare la pianificazione.

---

## 3. Logica di Implementazione (Data Integrity)
Per ogni statistica, Antigravity deve:
1. Verificare che l'`organizationId` dell'utente Admin coincida con quello dei record cercati.
2. In caso di `teacher_assignments`, fare il join (lookup) tra `users`, `subjects` e `classes` per mostrare nomi leggibili e non solo ID.
3. Se un dato è critico (es. Classe senza studenti), usare una classe CSS di "Warning" definita in `styles.css`.