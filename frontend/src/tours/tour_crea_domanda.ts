import { IStepOption } from 'ngx-ui-tour-ng-bootstrap';

export const crea_domanda_steps: IStepOption[] = [
  // ─── INTESTAZIONE ────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_header',
    title: 'Crea una nuova domanda',
    content:
      'Questa pagina ti permette di creare o modificare una domanda per la tua banca domande. Compila tutti i campi del form e salvala: sarà subito disponibile per essere usata nei test e nelle esercitazioni.',
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── TIPOLOGIA ───────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_tipo',
    title: 'Tipologia di risposta',
    content:
      "Scegli il formato della domanda: aperta (risposta libera dello studente), scelta multipla (una o più opzioni tra quelle che definisci) oppure vero/falso (l'affermazione è vera o falsa). La scelta determina i campi aggiuntivi che appariranno più in basso.",
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── ARGOMENTO ───────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_argomento',
    title: 'Argomento',
    content:
      "Associa la domanda a uno degli argomenti della materia corrente. Questo ti permette di organizzare la banca domande per argomento e di filtrare le domande quando costruisci un test o generi contenuti con l'AI.",
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── DIFFICOLTÀ ──────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_difficolta',
    title: 'Difficoltà',
    content:
      'Indica il livello di difficoltà della domanda: da Elementare a Molto difficile. Questa informazione è utile per calibrare i test in base al livello della classe e per filtrare le domande in banca.',
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── CONTENUTO ───────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_contenuto',
    title: 'Testo della domanda',
    content:
      "Scrivi il testo della domanda nell'area di testo a sinistra. Puoi anche allegare un'immagine trascinandola nell'area a destra o cliccandoci sopra. Se hai bisogno di ispirazione, usa il pulsante \"Genera con AI\" per ottenere un testo di partenza che potrai modificare liberamente.",
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── OPZIONI SCELTA MULTIPLA (condizionale) ──────────────────────────────────
  {
    anchorId: 'crea_domanda_opzioni',
    title: 'Opzioni di risposta',
    content:
      'Definisci le opzioni di risposta per la domanda a scelta multipla. Aggiungi almeno due alternative e contrassegna quella corretta. Puoi aggiungere quante opzioni vuoi: più alternative rendi plausibili, più la domanda sarà impegnativa.',
    placement: 'bottom',
    route: '/t/create-question',
    isOptional: true,
  },
  // ─── VERO/FALSO (condizionale) ───────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_verofalso',
    title: 'Risposta corretta',
    content:
      "Per le domande vero/falso, seleziona qui se l'affermazione scritta nel testo è vera o falsa. Questa sarà la risposta che il sistema considererà corretta al momento della correzione automatica.",
    placement: 'bottom',
    route: '/t/create-question',
    isOptional: true,
  },
  // ─── SPIEGAZIONE ─────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_spiegazione',
    title: 'Spiegazione della risposta',
    content:
      "Aggiungi una spiegazione della risposta corretta. Questo testo viene mostrato allo studente dopo che ha risposto alla domanda, sia in caso di risposta esatta che errata. È un ottimo strumento per rinforzare l'apprendimento.",
    placement: 'bottom',
    route: '/t/create-question',
  },
  // ─── TAG ─────────────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_tag',
    title: 'Tag',
    content:
      'Aggiungi dei tag per categorizzare ulteriormente la domanda. Premi Invio o la virgola per confermare ogni tag. I tag ti aiutano a trovare rapidamente le domande in banca e a raggrupparle per tema in modo trasversale rispetto agli argomenti.',
    placement: 'top',
    route: '/t/create-question',
  },
  // ─── VISIBILITÀ ──────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_visibilita',
    title: 'Visibilità',
    content:
      "Scegli se rendere la domanda disponibile agli studenti per i test di autovalutazione oppure tenerla riservata solo ai docenti. Le domande private non compaiono mai nell'area studente, anche se usate in un test che gli studenti possono rivedere.",
    placement: 'top',
    route: '/t/create-question',
  },
  // ─── SALVA ───────────────────────────────────────────────────────────────────
  {
    anchorId: 'crea_domanda_salva',
    title: 'Salva la domanda',
    content:
      'Quando hai compilato tutti i campi obbligatori, clicca qui per salvare la domanda nella tua banca domande. Potrai modificarla in qualsiasi momento tornando sulla banca e aprendo la domanda desiderata.',
    placement: 'top',
    route: '/t/create-question',
  },
];
