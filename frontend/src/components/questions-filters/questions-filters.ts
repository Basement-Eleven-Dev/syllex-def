import { TitleCasePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { QuestionCard } from '../question-card/question-card';

export interface Question {
  id: string;
  img?: string;
  text: string;
  type: 'scelta multipla' | 'vero falso' | 'risposta aperta';
  subject: string;
  options?: { label: string; isCorrect: boolean }[];
}

@Component({
  selector: 'app-questions-filters',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TitleCasePipe,
    DragDropModule,
    CdkDrag,
    QuestionCard,
  ],
  templateUrl: './questions-filters.html',
  styleUrl: './questions-filters.scss',
})
export class QuestionsFilters implements OnInit, OnDestroy {
  @Output() filtersChanged = new EventEmitter<{
    searchTerm: string;
    type: string;
  }>();

  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
    type: new FormControl(''),
  });

  // Mock data - sostituire con chiamata al servizio
  availableQuestions: Question[] = [
    {
      id: '1',
      img: 'https://t4.ftcdn.net/jpg/06/57/37/01/360_F_657370150_pdNeG5pjI976ZasVbKN9VqH1rfoykdYU.jpg',
      text: "Qual è la capitale dell'Italia?",
      type: 'scelta multipla',
      subject: 'Geografia',
      options: [
        { label: 'Milano', isCorrect: false },
        { label: 'Roma', isCorrect: true },
      ],
    },
    {
      id: '2',
      text: 'Il sole sorge a est',
      type: 'vero falso',
      subject: 'Scienze',
    },
    {
      id: '3',
      text: "Descrivi il ciclo dell'acqua",
      type: 'risposta aperta',
      subject: 'Scienze',
    },
  ];

  filteredQuestions: Question[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filteredQuestions = [...this.availableQuestions];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
