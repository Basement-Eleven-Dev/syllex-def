import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const test_steps: IStepOption[] = [
  // ─── INTESTAZIONE ────────────────────────────────────────────────────────────
  {
    anchorId: 'test_header',
    title: 'I tuoi test',
    content:
      'Questa è la pagina dei test. Qui trovi tutti i test che hai creato per la materia selezionata: compiti in classe, verifiche ed esercitazioni. Puoi gestirli, correggerli e assegnarli alle tue classi.',
    placement: 'bottom',
    route: '/t/tests',
  },
  // ─── NUOVO TEST ──────────────────────────────────────────────────────────────
  {
    anchorId: 'test_new_button',
    title: 'Crea un nuovo test',
    content:
      "Clicca qui per creare un nuovo test. Potrai costruire il test aggiungendo domande dalla tua banca domande, generandone di nuove con l'AI al volo o scrivendo domande personalizzate. Il test viene creato in bozza: potrai pubblicarlo quando sei pronto.",
    placement: 'bottom-left',
    route: '/t/tests',
  },
  // ─── FILTRI ──────────────────────────────────────────────────────────────────
  {
    anchorId: 'test_filters',
    title: 'Cerca e filtra',
    content:
      'Usa il campo di ricerca per trovare un test per nome. Puoi anche filtrare per stato: "Bozza" (non ancora pubblicato), "Pubblicato" (visibile agli studenti) o "Archiviato" (chiuso). Il toggle a destra alterna tra vista a griglia e vista a tabella.',
    placement: 'bottom',
    route: '/t/tests',
  },
  // ─── CARD (opzionale: potrebbe non esserci alcun test) ───────────────────────
  {
    anchorId: 'test_first_card',
    title: 'Card test',
    content:
      'Ogni card mostra le informazioni principali del test: lo stato (con il relativo colore), il nome, il periodo di disponibilità, il numero di domande e i punti totali, e le classi a cui è assegnato. Se ci sono tentativi in attesa di correzione, appare un badge giallo con il numero. Clicca "Visualizza Test" per aprirlo o usa il menu a tre punti per duplicarlo, pubblicarlo o eliminarlo.',
    placement: 'right',
    route: '/t/tests',
    isOptional: true,
  },
  // ─── PAGINAZIONE ─────────────────────────────────────────────────────────────
  {
    anchorId: 'test_pagination',
    title: 'Paginazione',
    content:
      'Naviga tra le pagine dei tuoi test con la paginazione. Se hai molti test, puoi anche aumentare il numero di elementi per pagina selezionando una delle opzioni nel menu a destra.',
    placement: 'top',
    route: '/t/tests',
  },
];
