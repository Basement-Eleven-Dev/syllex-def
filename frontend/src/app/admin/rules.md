🚀 Syllex Admin: Onboarding Technical Guide
Questo documento serve come "fonte di verità" per Antigravity nella progettazione della procedura di onboarding manuale gestita dal team tecnico.

🎨 UI/UX Guidelines & Design System
Per lo sviluppo dell'interfaccia Admin, seguiamo questi principi cardine:

CSS Source of Truth: È categoricamente vietato scrivere CSS inline o nuovi file CSS ridondanti. Ogni componente deve ereditare le classi da styles.css. Se una utility non esiste, si valuta se estendere il file globale o usare una variabile CSS esistente.

Usabilità "Smart":

Feedback Immediato: Ogni azione (creazione utente, link materia) deve mostrare un toast di successo o errore.

Auto-Complete & Search: Dato che l'onboarding è tecnico, le select devono permettere la ricerca per _id o name.

Data Validation: Validazione front-end rigorosa (es. formati email, OID validi) per evitare round-trip falliti verso il DB.

Flusso di Navigazione: Un processo a "step" (Wizard) è preferibile per mantenere lo stato dei dati pulito, ma deve permettere di tornare indietro senza perdere l'input.

🏗️ Database Logic (Data Mapping)
Relazioni Chiave (Focus Tecnico)
Organization: Il punto di partenza (organizationId).

Users: Discriminati per role. Fondamentale il cognitoId per l'allineamento con l'auth di AWS.

Teacher_Assignments: La collezione "pivot". È il punto critico dove si collegano teacherId, subjectId e classId. Senza questo record, il sistema è vuoto per il docente.

🛠️ Procedura Operativa di Onboarding (Flow)
Dato che l'onboarding è eseguito da sviluppatori, il flusso deve seguire questa sequenza logica per garantire l'integrità referenziale:

Step 1: Root Setup
Creare la Organization.

Caricare il Logo su S3 e salvare l'URL nel record.

Step 2: Staff Provisioning
Creazione Admin e Teachers.

Nota: Generare i cognitoId prima o durante la creazione dell'utente nel DB.

Step 3: Didactic Structure
Subjects: Creare le materie collegandole al teacherId responsabile.

Classes: Creare le classi (nomi e anni).

Students: Importazione massiva (o singola) degli studenti. Associare subito i loro ID nell'array students della collezione classes.

Step 4: Final Linkage (The Glue)
Popolamento di teacher_assignments.

Controllo di coerenza: Antigravity deve verificare che il docente scelto per l'assignment sia lo stesso (o uno di quelli) associati alla materia.

💡 Consigli Bonus per l'Efficienza (Dev-Friendly)
Ecco cosa suggerisco di implementare per rendere l'onboarding tecnico un gioco da ragazzi:

Bulk Import: Visto che sono i dev a farlo, implementa una funzione "Paste JSON" o "Upload CSV" per la lista studenti. È più veloce che creare 30 utenti a mano.

ID Clipboard: Accanto a ogni oggetto creato (Org, Teacher, Class), metti un tasto "Copia ID". Serve tantissimo quando si fanno gli accoppiamenti manuali.

Logs di Onboarding: Un piccolo pannello che mostra gli ultimi 5 record creati nella sessione per evitare duplicati se il browser viene aggiornato.

Preview del Test: Permetti di creare un "Test di Prova" automatico alla fine dell'onboarding per verificare che il docente veda correttamente la classe.