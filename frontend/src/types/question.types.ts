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

export type QuestionDifficulty =
  | 'elementary'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'very_hard';

export const DIFFICULTY_OPTIONS: {
  value: QuestionDifficulty;
  label: string;
}[] = [
  { value: 'elementary', label: 'Elementare' },
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difficile' },
  { value: 'very_hard', label: 'Molto difficile' },
];

export const DIFFICULTY_LABEL_MAP: Record<QuestionDifficulty, string> = {
  elementary: 'Elementare',
  easy: 'Facile',
  medium: 'Media',
  hard: 'Difficile',
  very_hard: 'Molto difficile',
};

export const QUESTION_TYPE_OPTIONS: TypeOption[] = [
  {
    label: 'Scelta multipla',
    description: 'Domande con più opzioni di risposta, di cui una corretta',
    icon: faSpellCheck,
    value: 'scelta multipla',
  },
  {
    label: 'Vero o falso',
    description: "Scegli se l'affermazione è vera o falsa",
    icon: faCheck,
    value: 'vero falso',
  },
  {
    label: 'Risposta aperta',
    description: 'Domande che richiedono una risposta testuale libera',
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
