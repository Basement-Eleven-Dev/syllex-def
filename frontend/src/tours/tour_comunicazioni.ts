import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const comunicazioni_steps: IStepOption[] = [
  // ─── INTESTAZIONE ────────────────────────────────────────────────────────────
  {
    anchorId: 'comunicazioni_header',
    title: 'Comunicazioni',
    content:
      'Questa è la pagina delle comunicazioni. Qui puoi inviare messaggi importanti, avvisi e aggiornamenti alle tue classi. Le comunicazioni possono contenere testo e allegati, e sono visibili agli studenti direttamente nella loro area personale.',
    placement: 'bottom',
    route: '/t/comunicazioni',
  },
  // ─── NUOVA COMUNICAZIONE ─────────────────────────────────────────────────────
  {
    anchorId: 'comunicazioni_new_button',
    title: 'Nuova comunicazione',
    content:
      'Clicca qui per creare una nuova comunicazione. Potrai scrivere un titolo, un messaggio e allegare file. Scegli a quali classi inviarla: solo gli studenti delle classi selezionate la riceveranno nella loro bacheca.',
    placement: 'bottom-left',
    route: '/t/comunicazioni',
  },
  // ─── FILTRI ──────────────────────────────────────────────────────────────────
  {
    anchorId: 'comunicazioni_filters',
    title: 'Cerca e filtra',
    content:
      'Usa la barra di ricerca per trovare una comunicazione per parole chiave. Puoi anche filtrare per classe destinataria o per presenza di allegati, così da trovare rapidamente quello che cerchi.',
    placement: 'bottom',
    route: '/t/comunicazioni',
  },
  // ─── PRIMA CARD (opzionale) ──────────────────────────────────────────────────
  {
    anchorId: 'comunicazioni_first_card',
    title: 'Card comunicazione',
    content:
      "Ogni card mostra il titolo, un'anteprima del contenuto, la data di ultima modifica e gli eventuali allegati. Usa il pulsante matita per modificare la comunicazione o quello con il cestino per eliminarla.",
    placement: 'bottom',
    route: '/t/comunicazioni',
    isOptional: true,
  },
  // ─── PAGINAZIONE ─────────────────────────────────────────────────────────────
  {
    anchorId: 'comunicazioni_pagination',
    title: 'Paginazione',
    content:
      'Naviga tra le pagine delle comunicazioni. Puoi scegliere quante comunicazioni visualizzare per pagina con il menu a destra.',
    placement: 'top',
    route: '/t/comunicazioni',
  },
];
