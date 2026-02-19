import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  input,
  signal,
} from '@angular/core';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { QuestionCard } from '../question-card/question-card';
import { QuestionsSearchFilters } from '../questions-search-filters/questions-search-filters';
import {
  QuestionsService,
  QuestionInterface,
} from '../../../services/questions';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';

@Component({
  selector: 'app-search-questions',
  standalone: true,
  imports: [
    DragDropModule,
    CdkDrag,
    QuestionCard,
    QuestionsSearchFilters,
    SyllexPagination,
  ],
  templateUrl: './search-questions.html',
  styleUrl: './search-questions.scss',
})
export class SearchQuestions implements OnInit, OnDestroy {
  // Input: IDs of questions already added to the test
  readonly selectedQuestionIds = input<string[]>([]);

  filteredQuestions = signal<QuestionInterface[]>([]);
  totalQuestions = signal<number>(0);
  isLoading = signal<boolean>(false);
  currentPage = signal<number>(1);
  readonly pageSize = 3;

  // Questions visible in the list (excluding already-selected ones)
  readonly visibleQuestions = computed(() =>
    this.filteredQuestions().filter(
      (q) => !this.selectedQuestionIds().includes(q._id),
    ),
  );

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
        this.currentPage.set(1);
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
        this.currentPage(),
        this.pageSize,
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadQuestions();
  }
}
