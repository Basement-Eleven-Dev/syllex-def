import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMarker,
  faSpellCheck,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { BehaviorSubject } from 'rxjs';

export type QuestionType = 'scelta multipla' | 'vero falso' | 'risposta aperta';
interface QuestionTypeButtonInterface {
  label: string;
  icon: IconDefinition;
  value: QuestionType;
}

@Component({
  selector: 'app-question-type-selectors',
  imports: [FontAwesomeModule],
  templateUrl: './question-type-selectors.html',
  styleUrl: './question-type-selectors.scss',
})
export class QuestionTypeSelectors {
  MultipleChoiceIcon = faSpellCheck;
  TrueFalseIcon = faCheck;
  OpenAnswerIcon = faMarker;

  selectedType$!: BehaviorSubject<QuestionType>;
  @Input() selectedType: QuestionType = 'scelta multipla';
  @Output() typeSelected = new EventEmitter<QuestionType>();
  @Input() direction: 'row' | 'column' = 'row';
  private isInitialized = false;

  ngOnInit(): void {
    console.log('Selected type on init:', this.selectedType);
    // Initialize the BehaviorSubject with the Input value
    this.selectedType$ = new BehaviorSubject<QuestionType>(this.selectedType);
    
    this.selectedType$.subscribe((type) => {
      this.selectedType = type;
      // Only emit if not during initialization
      if (this.isInitialized) {
        this.typeSelected.emit(this.selectedType!);
      }
    });
    this.isInitialized = true;
  }

  questionTypes: QuestionTypeButtonInterface[] = [
    {
      label: 'Scelta multipla',
      icon: this.MultipleChoiceIcon,
      value: 'scelta multipla',
    },
    { label: 'Vero o falso', icon: this.TrueFalseIcon, value: 'vero falso' },
    {
      label: 'Risposta aperta',
      icon: this.OpenAnswerIcon,
      value: 'risposta aperta',
    },
  ];
}
