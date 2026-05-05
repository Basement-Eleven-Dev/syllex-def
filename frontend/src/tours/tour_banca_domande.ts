import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const banca_domande_steps: IStepOption[] = [
  {
    anchorId: 'banca_header',
    title: 'Le tue domande',
    content:
      'Questa è la tua banca domande, dove puoi visualizzare, modificare e organizzare tutte le domande che hai creato o salvato. Il numero accanto al titolo indica quante domande sono attualmente nella tua banca.',
    placement: 'right',
    route: '/t/banca',
  },
  {
    anchorId: 'banca_filters',
    title: 'Filtri di ricerca domande',
    content:
      'Utilizza i filtri per cercare le domande che ti interessano. Puoi filtrare per tipologia, argomento, difficoltà e altri criteri.',
    placement: 'bottom',
    route: '/t/banca',
  },
  {
    anchorId: 'banca_toggle',
    title: 'Cambio vista',
    content:
      'Puoi cambiare la visualizzazione delle domande tra griglia e tabella utilizzando questo toggle.',
    placement: 'bottom',
    route: '/t/banca',
  },
  {
    anchorId: 'banca_pagination',
    title: 'Paginazione',
    content:
      'Utilizza la paginazione per navigare tra le diverse pagine di domande. Puoi anche scegliere quante domande visualizzare per pagina.',
    placement: 'top',
    route: '/t/banca',
  },
];
