import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const dashboard_steps: IStepOption[] = [
  {
    anchorId: 'teacher-subject-select',
    title: 'Materia Corrente',
    content:
      'Tutto ciò che vedi è filtrato per la materia selezionata. Clicca qui per cambiarla.',
    placement: 'right',
    route: '/t/dashboard',
  },
  {
    anchorId: 'dashboard_welcome',
    title: 'Benvenuto nella Dashboard',
    content:
      'Questa è la tua home: da qui hai una panoramica completa di tutto ciò che riguarda la tua materia.',
    placement: 'bottom',
    route: '/t/dashboard',
  },
  {
    anchorId: 'dashboard_quick_actions',
    title: 'Azioni Rapide',
    content:
      'Usa questi pulsanti per accedere velocemente alle funzionalità principali: crea domande, avvia test, genera materiali e molto altro.',
    placement: 'bottom',
    route: '/t/dashboard',
  },
  {
    anchorId: 'dashboard_communications',
    title: 'Comunicazioni',
    content:
      'Qui trovi le ultime comunicazioni inviate agli studenti. Cliccaci sopra per modificarle o clicca "Vedi tutte" per gestirle.',
    placement: 'left',
    route: '/t/dashboard',
  },
  {
    anchorId: 'dashboard_calendar',
    title: 'Calendario',
    content:
      'Il calendario mostra tutti gli eventi e i test programmati per la tua classe. Tienilo sempre aggiornato!',
    placement: 'top',
    route: '/t/dashboard',
  },
  {
    anchorId: 'teacher-banca',
    title: 'Banca Domande',
    content:
      'Organizza il tuo archivio personale di domande da riutilizzare ai test o nelle esercitazioni libere della classe.',
    placement: 'right',
    route: '/t/banca',
  },
  {
    anchorId: 'teacher-tests',
    title: 'Test',
    content:
      "Crea e correggi compiti in classe o esercitazioni. Sfrutta l'AI per generare domande al volo o pescale dalla tua Banca.",
    placement: 'right',
    route: '/t/tests',
  },
  {
    anchorId: 'teacher-agent',
    title: 'Agente AI',
    content:
      'Il tuo assistente personale: un Agente esperto della tua materia pronto ad aiutarti a preparare lezioni e materiali.',
    placement: 'right',
    route: '/t/agente',
  },
  {
    anchorId: 'teacher-ai-lab',
    title: 'Laboratorio AI',
    content:
      "Sperimenta con strumenti avanzati basati sull'AI per creare contenuti didattici interattivi.",
    placement: 'right',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'teacher-profile',
    title: 'Profilo Docente',
    content:
      'Da qui puoi accedere alle tue impostazioni, calendario o segnalare un problema.',
    placement: 'bottom',
  },
];
