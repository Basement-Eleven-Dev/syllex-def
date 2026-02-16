import {
  faAlignLeft,
  faChartDiagram,
  faCheck,
  faList,
  faMarker,
  faPresentationScreen,
  faSpellCheck,
} from '@fortawesome/pro-solid-svg-icons';
import { TypeOption } from '../teacher/components/type-selector/type-selector';

export type QuestionType = 'scelta multipla' | 'vero falso' | 'risposta aperta';
export type MaterialType =
  | 'slides'
  | 'riassunto'
  | 'glossario'
  | 'mappe-concettuali';

export const QUESTION_TYPE_OPTIONS: TypeOption[] = [
  {
    label: 'Scelta multipla',
    description: 'Domande con opzioni di risposta multiple',
    icon: faSpellCheck,
    value: 'scelta multipla',
  },
  {
    label: 'Vero o falso',
    description: 'Domande con risposte binarie',
    icon: faCheck,
    value: 'vero falso',
  },
  {
    label: 'Risposta aperta',
    description: 'Domande che richiedono risposte dettagliate',
    icon: faMarker,
    value: 'risposta aperta',
  },
];

export const MATERIAL_TYPE_OPTIONS: TypeOption[] = [
  {
    label: 'Slides',
    description: 'Presentazioni per lezioni o conferenze',
    icon: faPresentationScreen,
    value: 'slides',
  },
  {
    label: 'Riassunto',
    description: 'Note dettagliate per lo studio',
    icon: faAlignLeft,
    value: 'riassunto',
  },
  {
    label: 'Glossario',
    description: 'Rappresentazioni schematiche di concetti',
    icon: faList,
    value: 'glossario',
  },
  {
    label: 'Mappe Concettuali',
    description: 'Mappe per visualizzare relazioni tra concetti',
    icon: faChartDiagram,
    value: 'mappe-concettuali',
  },
];
