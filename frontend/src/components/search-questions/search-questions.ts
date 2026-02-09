import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { QuestionCard } from '../question-card/question-card';
import { QuestionsSearchFilters } from '../questions-search-filters/questions-search-filters';
import { QuestionsService, QuestionInterface } from '../../services/questions';

@Component({
  selector: 'app-search-questions',
  standalone: true,
  imports: [DragDropModule, CdkDrag, QuestionCard, QuestionsSearchFilters],
  templateUrl: './search-questions.html',
  styleUrl: './search-questions.scss',
})
export class SearchQuestions implements OnInit, OnDestroy {
  @Input() subjectId?: string;

  filteredQuestions = signal<QuestionInterface[]>([]);
  totalQuestions = signal<number>(0);
  isLoading = signal<boolean>(false);

  private currentFilters: {
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  } = {};

  private destroy$ = new Subject<void>();
  private filtersChanged$ = new Subject<{
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }>();

  constructor(private questionsService: QuestionsService) {}

  ngOnInit(): void {
    // Setup debounced filter subscription
    this.filtersChanged$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.currentFilters = filters;
        this.loadQuestions();
      });

    // Initial load
    this.loadQuestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChanged(filters: {
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }): void {
    this.filtersChanged$.next(filters);
  }

  private loadQuestions(): void {
    this.isLoading.set(true);

    this.questionsService
      .loadPagedQuestions(
        this.currentFilters.searchTerm,
        this.currentFilters.type,
        this.currentFilters.topicId,
        this.currentFilters.policy,
        1,
        5,
        this.subjectId,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.filteredQuestions.set(response.questions);
          this.totalQuestions.set(response.total);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Errore nel caricamento delle domande:', error);
          this.isLoading.set(false);
        },
      });
  }
}
