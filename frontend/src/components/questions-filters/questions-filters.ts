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
import { QuestionsSearchFilters } from '../questions-search-filters/questions-search-filters';
import { mockQuestions } from '../../mock_questions';

export interface Question {
  id: string;
  img?: string;
  text: string;
  type: 'scelta multipla' | 'vero falso' | 'risposta aperta';
  topic: string;
  explanation: string;
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
    QuestionsSearchFilters,
  ],
  templateUrl: './questions-filters.html',
  styleUrl: './questions-filters.scss',
})
export class QuestionsFilters implements OnInit, OnDestroy {
  // Mock data - sostituire con chiamata al servizio
  availableQuestions: Question[] = mockQuestions;

  filteredQuestions: Question[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filteredQuestions = [...this.availableQuestions];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChanged(filters: { searchTerm: string; type: string }): void {
    // Logica di filtraggio delle domande basata sui filtri ricevuti
    // Per ora, resettiamo semplicemente la lista filtrata a tutte le domande
    this.filteredQuestions = [...this.availableQuestions];
  }
}
