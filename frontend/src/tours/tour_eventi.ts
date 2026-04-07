import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const eventi_steps: IStepOption[] = [
  // ─── INTESTAZIONE ────────────────────────────────────────────────────────────
  {
    anchorId: 'eventi_header',
    title: 'Gli eventi della tua classe',
    content:
      'Questa è la pagina degli eventi. Qui puoi visualizzare tutti gli eventi programmati per la tua materia sul calendario: test, verifiche, uscite didattiche e qualsiasi altro appuntamento importante per le tue classi.',
    placement: 'bottom',
    route: '/t/eventi',
  },
  // ─── NUOVO EVENTO ────────────────────────────────────────────────────────────
  {
    anchorId: 'eventi_new_button',
    title: 'Crea un nuovo evento',
    content:
      'Clicca qui per creare un nuovo evento. Potrai scegliere un titolo, una data, una descrizione e le classi coinvolte. Una volta salvato, apparirà sul calendario nella data indicata.',
    placement: 'bottom-left',
    route: '/t/eventi',
  },
  // ─── CALENDARIO (contenitore) ────────────────────────────────────────────────
  {
    anchorId: 'eventi_calendario',
    title: 'Il tuo calendario',
    content:
      'Questo è il calendario della materia selezionata. Mostra tutti gli eventi creati, i test pubblicati e le comunicazioni programmati nel mese corrente. Ogni giorno con contenuti mostra un badge colorato: blu per eventi/test, azzurro per comunicazioni.',
    placement: 'top',
    route: '/t/eventi',
  },
  // ─── NAVIGAZIONE MESE ────────────────────────────────────────────────────────
  {
    anchorId: 'calendario_nav',
    title: 'Naviga tra i mesi',
    content:
      'Usa le frecce per spostarti avanti o indietro di un mese. Puoi così consultare eventi passati o pianificare quelli futuri.',
    placement: 'bottom',
    route: '/t/eventi',
  },
  // ─── GRIGLIA GIORNI ──────────────────────────────────────────────────────────
  {
    anchorId: 'calendario_griglia',
    title: 'Griglia del mese',
    content:
      'Questa è la griglia mensile del calendario. Ogni cella rappresenta un giorno: i giorni con eventi mostrano un badge con il numero di elementi. Clicca su un giorno per selezionarlo e vedere il dettaglio degli eventi nel pannello a destra.',
    placement: 'right',
    route: '/t/eventi',
  },
  // ─── PANNELLO DETTAGLIO GIORNO ───────────────────────────────────────────────
  {
    anchorId: 'calendario_dettaglio_giorno',
    title: 'Dettaglio del giorno',
    content:
      'Dopo aver selezionato un giorno nella griglia, questo pannello mostra tutti i contenuti di quella data: comunicazioni, eventi personalizzati e test programmati. Puoi aggiungere un nuovo evento direttamente dal pulsante "Nuovo Evento" che appare in alto, oppure modificare o eliminare quelli esistenti.',
    placement: 'left',
    route: '/t/eventi',
  },
];
