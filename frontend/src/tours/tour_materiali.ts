import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const materiali_steps: IStepOption[] = [
  // ─── INTESTAZIONE ────────────────────────────────────────────────────────────
  {
    anchorId: 'materiali_header',
    title: 'File e Risorse',
    content:
      'Benvenuto nella sezione File e Risorse! Qui puoi caricare, organizzare e gestire tutti i materiali didattici della materia selezionata. I file caricati saranno disponibili per il tuo assistente AI e per la generazione di contenuti nel Laboratorio AI.',
    placement: 'bottom',
    route: '/t/risorse',
  },
  // ─── BARRA SPAZIO ───────────────────────────────────────────────────────────
  {
    anchorId: 'materiali_storage_bar',
    title: 'Spazio disponibile',
    content:
      'Questa barra mostra quanto spazio di archiviazione hai utilizzato e quanto ti rimane a disposizione. Quando lo spazio è esaurito, il caricamento e la generazione di nuovi file verranno disabilitati.',
    placement: 'bottom',
    route: '/t/risorse',
  },
  // ─── RICERCA E TOGGLE VISTA ──────────────────────────────────────────────────
  {
    anchorId: 'materiali_search',
    title: 'Cerca e filtra',
    content:
      'Usa il campo di ricerca per trovare rapidamente un file o una cartella per nome. Puoi anche cambiare la visualizzazione tra griglia e tabella con il toggle a destra per adattarla alle tue preferenze.',
    placement: 'bottom-left',
    route: '/t/risorse',
  },
  // ─── CONTENUTO PRINCIPALE ────────────────────────────────────────────────────
  {
    anchorId: 'materiali_content',
    title: 'I tuoi file',
    content:
      "Qui vengono mostrati tutti i tuoi file e le cartelle. Puoi navigare nelle sottocartelle cliccando su di esse, spostare i file tramite drag & drop e selezionare più elementi tenendo premuto il tasto di selezione. I file generati dall'AI sono contrassegnati da un'icona robot viola.",
    placement: 'bottom',
    route: '/t/risorse',
  },
  // ─── PRIMA CARD (opzionale: potrebbe non esserci alcun elemento) ────────────
  {
    anchorId: 'materiali_first_card',
    title: 'Card file / cartella',
    content:
      "Ogni elemento è rappresentato da una card. Se è una cartella puoi aprirla con un doppio click per navigare al suo interno. Se è un file, un doppio click lo apre o avvia il download. Il menu a tre puntini in alto a destra ti permette di rinominarlo o eliminarlo. I file generati dall'AI sono contrassegnati da un badge viola.",
    placement: 'right',
    route: '/t/risorse',
    isOptional: true,
  },
  // ─── AZIONI ─────────────────────────────────────────────────────────────────
  {
    anchorId: 'materiali_new_folder',
    title: 'Nuova cartella',
    content:
      'Crea una nuova cartella per organizzare i tuoi file. Puoi creare una struttura gerarchica di cartelle per tenere tutto ordinato per argomento, tipo di materiale o qualsiasi altro criterio ti sia utile.',
    placement: 'bottom',
    route: '/t/risorse',
  },
  {
    anchorId: 'materiali_upload',
    title: 'Carica file',
    content:
      "Carica un file dal tuo dispositivo. Sono supportati documenti, PDF, immagini e altri formati comuni. Il file verrà caricato nella cartella attualmente aperta e sarà subito disponibile per essere usato dall'AI.",
    placement: 'bottom',
    route: '/t/risorse',
  },
  {
    anchorId: 'materiali_generate_ai',
    title: 'Genera con AI',
    content:
      "Hai bisogno di un nuovo materiale didattico? Con questo pulsante puoi generare direttamente un file tramite l'AI di Syllex, scegliendo tra riassunti, mappe concettuali, presentazioni e altro ancora. Il file generato verrà salvato automaticamente in questa sezione.",
    placement: 'bottom',
    route: '/t/risorse',
  },
];
