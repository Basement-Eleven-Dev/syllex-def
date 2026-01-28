import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMarker,
  faPlus,
  faSpellCheck,
} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-gen-ai-question',
  imports: [FontAwesomeModule],
  templateUrl: './gen-ai-question.html',
  styleUrl: './gen-ai-question.scss',
})
export class GenAiQuestion {
  @Input() type: 'scelta multipla' | 'vero falso' | 'risposta aperta' =
    'scelta multipla';
  @Input() topic: string = '';
  @Input() difficulty: 'facile' | 'media' | 'difficile' = 'media';
  @Input() topics: string[] = [];
  @Input() topicSelected: string = '';

  MultipleChoiceIcon = faSpellCheck;
  TrueFalseIcon = faPlus;
  OpenAnswerIcon = faMarker;
}
