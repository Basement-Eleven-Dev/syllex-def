import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const laboratorio_ai_steps: IStepOption[] = [
  // ─── PAGINA ─────────────────────────────────────────────────────────────────
  {
    anchorId: 'laboratorio_ai_header',
    title: 'Laboratorio AI',
    content:
      "Benvenuto nel Laboratorio AI di Syllex! Qui puoi creare contenuti didattici professionali in pochi click grazie all'intelligenza artificiale: materiali di studio completi e domande per i test, tutto su misura per la tua materia.",
    placement: 'bottom',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'laboratorio_ai_type_cards',
    title: 'Scegli cosa generare',
    content:
      'Hai due modalità di creazione: "Materiale di studio" per documenti, riassunti e presentazioni, oppure "Domande dei Test" per popolare la tua banca domande. Clicca su una delle due card per attivare il form di generazione corrispondente.',
    placement: 'top',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'laboratorio_ai_card_materials',
    title: 'Materiale di studio',
    content:
      'Seleziona questa card per generare materiali didattici: riassunti, mappe concettuali, slide e altri contenuti per supportare le tue lezioni. È la modalità predefinita: una volta generato, il file sarà disponibile nella sezione File e Risorse.',
    placement: 'bottom',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'laboratorio_ai_card_questions',
    title: 'Domande dei Test',
    content:
      "Seleziona questa card per generare domande da aggiungere alla tua banca domande. Potrai specificare l'argomento, la difficoltà e il formato (aperte, scelta multipla, vero/falso...). Dopo la generazione avrai la possibilità di rivedere e selezionare solo le domande che vuoi salvare.",
    placement: 'bottom',
    route: '/t/laboratorio-ai',
  },
  // ─── FORM COMUNE ────────────────────────────────────────────────────────────
  {
    anchorId: 'gen_ai_type_selector',
    title: 'Tipologia di contenuto',
    content:
      'Scegli la tipologia specifica di contenuto. Per i materiali puoi selezionare tra riassunto, mappa concettuale, slide e altro. Per le domande puoi scegliere tra domande aperte, a scelta multipla, vero/falso e altre tipologie. La scelta cambia i parametri disponibili nel form.',
    placement: 'bottom',
    route: '/t/laboratorio-ai',
  },
  // ─── FORM DOMANDE (visibili solo con modalità "questions") ──────────────────
  {
    anchorId: 'gen_ai_q_topic',
    title: 'Argomento delle domande',
    content:
      "Seleziona l'argomento su cui vuoi che l'AI si concentri. Gli argomenti disponibili sono quelli definiti nella tua materia corrente. Una selezione precisa produce domande più pertinenti e coerenti con il programma svolto in classe.",
    placement: 'bottom',
    route: '/t/laboratorio-ai',
    isOptional: true,
  },
  {
    anchorId: 'gen_ai_q_params',
    title: 'Parametri delle domande',
    content:
      'Configura i parametri di generazione: il numero di domande da creare (fino a 20), il numero di alternative per le domande a scelta multipla, la lingua e il livello di difficoltà. Scegli in base al livello della tua classe e agli obiettivi del test.',
    placement: 'bottom',
    route: '/t/laboratorio-ai',
    isOptional: true,
  },
  // ─── FORM MATERIALI (visibile solo con modalità "materials") ─────────────────
  {
    anchorId: 'gen_ai_m_params',
    title: 'Parametri del materiale',
    content:
      'Configura i parametri per il materiale da generare: la lingua del documento e, per le presentazioni, il numero di slide. Puoi scegliere il formato di output tra PPTX (file PowerPoint modificabile) e PDF (documento statico pronto per la stampa o la condivisione).',
    placement: 'bottom',
    route: '/t/laboratorio-ai',
    isOptional: true,
  },
  // ─── FORM COMUNE (FINE) ──────────────────────────────────────────────────────
  {
    anchorId: 'gen_ai_support_files',
    title: 'File di supporto',
    content:
      'Indica all\'AI quali file e risorse della materia deve usare come base per la generazione. Seleziona i materiali già caricati nella sezione "File e Risorse": più contesto pertinente fornisci, più preciso e coerente con il tuo programma sarà il risultato.',
    placement: 'top',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'gen_ai_instructions',
    title: 'Istruzioni aggiuntive',
    content:
      'Aggiungi indicazioni personalizzate per guidare la generazione: stile, tono, aspetti specifici da trattare o requisiti particolari. Più sono dettagliate le istruzioni, più il contenuto generato sarà su misura per le tue esigenze didattiche.',
    placement: 'top',
    route: '/t/laboratorio-ai',
  },
  {
    anchorId: 'gen_ai_submit',
    title: 'Avvia la generazione',
    content:
      "Quando sei soddisfatto della configurazione, clicca per avviare la generazione. L'AI elaborerà la tua richiesta in base a tutti i parametri impostati. Mantieni la pagina aperta fino al completamento per non perdere il risultato.",
    placement: 'top',
    route: '/t/laboratorio-ai',
  },
  // ─── FASE DI REVISIONE (visibile solo dopo generazione domande) ─────────────
  {
    anchorId: 'gen_ai_review_controls',
    title: 'Revisione delle domande generate',
    content:
      'Dopo la generazione, le domande vengono mostrate in questa fase di revisione. Puoi usare "Seleziona tutte" per un\'azione rapida, oppure deselezionare le domande che non ti convincono. Clicca "Nuova generazione" per tornare al form e ricominciare.',
    placement: 'bottom',
    route: '/t/laboratorio-ai',
    isOptional: true,
  },
  {
    anchorId: 'gen_ai_review_save',
    title: 'Salva le domande selezionate',
    content:
      'Dopo aver scelto le domande da mantenere, clicca qui per salvarle direttamente nella tua banca domande. Saranno immediatamente disponibili per essere usate nei test e nelle esercitazioni in classe.',
    placement: 'top',
    route: '/t/laboratorio-ai',
    isOptional: true,
  },
];
