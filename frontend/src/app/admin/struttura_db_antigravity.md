# Documentazione Struttura Database NoSQL (Context per Antigravity)

Questo documento descrive lo schema delle collezioni MongoDB e le relazioni logiche necessarie per gestire l'onboarding e le operazioni didattiche.

---

## 🏗️ 1. Mappa delle Collezioni

### `organizations` (Entità Radice)
Rappresenta l'istituto o l'ente di formazione.
- `_id`: Identificativo univoco (ObjectId).
- `name`: Nome dell'organizzazione (es. "Marina Militare").
- `courses`: Array di riferimenti (ObjectId) ai corsi attivi.
- `logoUrl`: Link all'asset grafico su AWS S3.
- `administrators`: Array di riferimenti (ObjectId) a utenti con ruolo admin.

### `users` (Anagrafica Utenti)
Contiene sia docenti che studenti.
- `role`: Definisce il tipo di utente (`teacher`, `student`, `admin`).
- `organizationId`: Chiave esterna che lega l'utente alla sua organizzazione di appartenenza.
- `cognitoId`: Identificativo per l'integrazione con AWS Cognito.

### `subjects` (Materie)
- `name`: Titolo della materia (es. "Scienze Nautiche").
- `teacherId`: Riferimento al docente responsabile della materia.

### `classes` (Classi)
- `name`: Nome della classe (es. "3A Informatica").
- `year`: Anno di riferimento.
- `students`: Array di ObjectId che puntano alla collezione `users` (filtrati per ruolo student).

### `teacher_assignments` (Cattedre e Accoppiamenti)
Questa collezione è il fulcro operativo. Lega un docente a una materia e a una classe specifica.
- `teacherId`: Riferimento a `users`.
- `subjectId`: Riferimento a `subjects`.
- `classId`: Riferimento a `classes`.

### `tests` (Valutazioni)
- `status`: Stato del test (`pubblicato`, `bozza`).
- `classIds`: Array di classi a cui il test è assegnato.
- `questions`: Elenco delle domande con relativi punteggi.
- `password`: Chiave di accesso per gli studenti.

---

## 🔄 2. Logica di Onboarding (Workflow Consigliato)

Per un onboarding coerente su Antigravity, i dati devono essere inseriti seguendo questa gerarchia:

1. **Creazione Organizzazione**: Definire il record `organizations`.
2. **Creazione Utenti Staff**: Creare docenti e amministratori in `users` legandoli all'ID organizzazione.
3. **Creazione Materie**: Definire i `subjects` associandoli ai docenti.
4. **Creazione Studenti e Classi**: 
   - Creare gli studenti (`users`).
   - Creare le `classes` inserendo gli ID degli studenti creati.
5. **Configurazione Insegnamento**: Creare i record in `teacher_assignments`. **Senza questo passaggio, il docente non ha visibilità sulle classi.**

---

## ⚠️ Note Tecniche per l'AI
- **Formato Date**: ISO 8601 (es. `2026-02-13T16:52:44.948Z`).
- **Integrità Referenziale**: Assicurarsi che ogni `teacherId` o `studentId` punti a un utente esistente con il ruolo corretto.
