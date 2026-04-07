import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const assistente_ai_steps: IStepOption[] = [
  {
    anchorId: 'assistente_ai_header',
    title: 'Agente AI',
    content:
      "Questa è la pagina dove puoi impostare e interagire l'assistente AI della materia selezionata. Potrà aiutare te e i tuoi studenti a preparare lezioni, rispondere a domande e fornire supporto educativo.",
    placement: 'bottom-left',
    route: '/t/agente',
  },
  {
    anchorId: 'assistente_ai_settings',
    title: 'Colonna impostazioni',
    content:
      "Questa è la colonna delle impostazioni del tuo assistente AI personale. Qui puoi configurare il tuo agente, impostare il nome e il tono, e gestire altre opzioni per personalizzare l'esperienza.",
    placement: 'after-top',
    route: '/t/agente',
  },
  {
    anchorId: 'assistente_ai_chat',
    title: 'Colonna chat',
    content:
      'Questa è la colonna della chat del tuo assistente AI personale. Una volta impostato puoi testarlo ed interagire con esso. Qui puoi interagire con il tuo agente, fare domande e ricevere risposte in tempo reale.',
    placement: 'before-top',
    route: '/t/agente',
  },
  {
    anchorId: 'assistente_ai_settings_materials',
    title: 'Associa materiali',
    content:
      'Indica al tuo agente quali materiali della materia selezionata deve conoscere per assisterti al meglio. Potrai scegliere tra quelli caricati nella sezione File e Risorse.',
    placement: 'right',
    route: '/t/agente',
  },
  {
    anchorId: 'assistente_ai_settings_save',
    title: 'Aggiorna impostazioni',
    content:
      'Dopo aver modificato le impostazioni del tuo agente, clicca qui per salvare le modifiche. Il tuo agente AI si aggiornerà con le nuove impostazioni e sarà pronto ad assisterti con la materia selezionata.',
    placement: 'right',
    route: '/t/agente',
  },
];
