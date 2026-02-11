---
agent: agent
---

Ottimo cambio di passo. Passiamo da un semplice "linter umano" a un vero e proprio Code Refactoring & Architectural Review.

Ecco il prompt aggiornato. Ho integrato la logica di estrazione dei componenti (Smart vs Dumb components) e la semplificazione della complessità ciclomatica (spezzare metodi lunghi).

Copia e incolla questo blocco.

Prompt: Angular 20 Deep Refactoring & Optimization
Ruolo: Agisci come un Lead Angular Architect esperto in Clean Architecture, Performance Optimization e Refactoring.

Obiettivo: Analizza il codice fornito. Non limitarti allo stile: devi ottimizzare la logica e ristrutturare l'architettura del componente. Il comportamento finale per l'utente deve rimanere invariato (niente bug o feature perse), ma l'implementazione deve essere drasticamente migliorata.

1. Refactoring Logico e TypeScript (.ts)
   Ottimizzazione Algoritmica:

Identifica metodi "God Object" (troppo lunghi o con troppe responsabilità). Spezzali in metodi privati più piccoli e focalizzati (single responsibility principle).

Rimuovi codice morto, variabili inutilizzate e logiche ridondanti.

Se trovi logica di business complessa (calcoli pesanti, trasformazioni dati), valuta se spostarla in un Service dedicato o in una UtilClass.

Modernizzazione Angular 20:

Trasforma le proprietà reattive in Signals (signal, computed) dove semplifica la gestione del change detection.

Usa inject() per le dipendenze.

Usa takeUntilDestroyed o AsyncPipe (nel template) invece di unsubscribe() manuali.

Convenzioni di Naming (Tassativo):

Proprietà/Variabili: PascalCase (es: UserList, IsVisible).

Metodi: camelCase (es: loadUserData).

Tutti i nomi devono essere in Inglese e descrittivi.

2. Architettura e Component Extraction
   Analisi Critica del Template: Se il template HTML supera le 100 righe o contiene blocchi logici ripetuti/distinti (es. una card, un elemento di lista complesso, una modale interna), DEVI estrarli.

Istruzione di Estrazione:

Crea il codice per i nuovi "Dumb Components" (o componenti di presentazione) necessari.

Nel componente principale (padre), sostituisci il blocco estratto con il tag del nuovo componente e passa i dati via @Input (o input() signal).

Template Syntax:

Usa esclusivamente Control Flow Syntax (@if, @for, @switch).

Rimuovi logica complessa dall'HTML (es. \*ngIf="a && b || c.length > 0"). Spostala in un computed signal nel TS.

3. Output Richiesto
   Restituisci il refactoring organizzato in questo modo:

Componente Principale (Refactorizzato):

File .ts (pulito, ordinato, ottimizzato).

File .html (usando la nuova sintassi e i nuovi child components).

File .scss (pulito).

Componenti Estratti (Se necessari):

Fornisci il codice completo (TS/HTML/SCSS) per ogni nuovo componente creato dall'estrazione. Dai loro nomi coerenti (es. user-card.component).

Nota per l'AI: Sii spietato con il codice legacy. Se un approccio è obsoleto, riscrivilo da zero usando le best practices di Angular 20.
