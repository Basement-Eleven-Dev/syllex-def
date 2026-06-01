import {
  Component,
  signal,
  computed,
  inject,
  effect,
  HostListener,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBroom,
  faPlus,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import {
  StudentTestInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { StudentTestCard } from '../../components/student-test-card/student-test-card';
import { Materia } from '../../../services/materia';
import { FeedbackService } from '../../../services/feedback-service';
import { SyllexPagination } from '../../../teacher/components/syllex-pagination/syllex-pagination';
import { FormsModule } from '@angular/forms';
import { SyllexPageHeader } from '../../../teacher/components/UI/syllex-page-header/syllex-page-header';
import { SyllexSearchInput } from '../../../teacher/components/UI/syllex-search-input/syllex-search-input';
import {
  SyllexSelectInput,
  SelectOption,
} from '../../../teacher/components/UI/syllex-select-input/syllex-select-input';
import { SyllexButton } from '../../../teacher/components/UI/syllex-button/syllex-button';

type AttemptStatus = 'in-progress' | 'delivered' | 'reviewed';

@Component({
  selector: 'app-student-tests-list',
  standalone: true,
  imports: [
    FontAwesomeModule,
    RouterModule,
    StudentTestCard,
    SyllexPagination,
    FormsModule,
    SyllexPageHeader,
    SyllexSearchInput,
    SyllexSelectInput,
    SyllexButton,
  ],
  templateUrl: './student-tests-list.html',
  styleUrl: './student-tests-list.scss',
})
export class StudentTestsList {
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly materiaService = inject(Materia);
  private readonly feedbackService = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);

  readonly ClearIcon = faBroom;
  readonly PlusIcon = faPlus;
  readonly SpinnerIcon = faSpinnerThird;

  readonly Tests = signal<StudentTestInterface[]>([]);
  readonly AttemptStatusMap = signal<Map<string, AttemptStatus>>(new Map());
  readonly AttemptResultMap = signal<
    Map<string, { correct: number; wrong: number }>
  >(new Map());
  readonly ShowOnlyPending = signal(false);
  readonly ShowOnlyAutoEval = signal(false);
  readonly IsCheckingStatuses = signal(false);
  readonly SearchTerm = signal('');
  readonly SelectedSubject = signal('');

  // Pagination
  readonly Page = signal(1);
  readonly PageSize = signal(6);
  readonly CollectionSize = signal(0);
  readonly IsLoadingMore = signal(false);

  readonly Subjects = this.materiaService.allMaterie;

  readonly FilteredTests = computed(() => {
    let list = this.Tests();
    
    if (this.ShowOnlyAutoEval()) {
      list = list.filter(t => t.source === 'self-evaluation');
    }
    
    if (this.ShowOnlyPending()) {
      const map = this.AttemptStatusMap();
      list = list.filter((t) => !map.has(t._id));
    }
    
    return list;
  });

  readonly SubjectOptions = (): SelectOption[] =>
    this.Subjects().map((s) => ({ value: s._id, label: s.name }));

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['autoEval'] === 'true') {
        this.ShowOnlyAutoEval.set(true);
      }
    });

    effect(() => {
      // If Page is 1, we overwrite the list.
      // If Page > 1 and we are on mobile, we append the results for infinite scroll.
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const append = this.Page() > 1 && isMobile;
      this.loadTests(append);
    });
  }

  @HostListener('window:scroll', [])
  @HostListener('scroll', ['$event'])
  onScroll(event?: any) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (!isMobile) return;

    let container = document.documentElement;
    if (event && event.target && event.target !== document) {
      container = event.target;
    }

    const threshold = 200;
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop || window.scrollY;
    const clientHeight = container.clientHeight || window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      this.loadMoreMobile();
    }
  }

  loadMoreMobile() {
    if (this.IsLoadingMore()) return;
    if (this.Tests().length >= this.CollectionSize()) return;

    this.Page.update((p) => p + 1);
  }

  loadTests(append = false) {
    if (this.IsLoadingMore()) return;
    if (append) this.IsLoadingMore.set(true);

    this.testsService
      .getAvailableTests(
        this.SearchTerm(),
        this.SelectedSubject(),
        this.Page(),
        this.PageSize(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (append) {
            this.Tests.update((existing) => [...existing, ...res.tests]);
          } else {
            this.Tests.set(res.tests);
          }
          this.CollectionSize.set(res.total);
          this.checkAttemptStatuses(res.tests);
          this.IsLoadingMore.set(false);
        },
        error: (err) => {
          console.error('Errore nel caricamento dei test:', err);
          this.feedbackService.showFeedback(
            'Errore nel caricamento dei test',
            false,
          );
          if (!append) {
            this.Tests.set([]);
            this.CollectionSize.set(0);
          }
          this.IsLoadingMore.set(false);
        },
      });
  }

  onSearchTermChange(term: string) {
    this.SearchTerm.set(term);
    this.Page.set(1);
  }

  onSubjectChange(subjectId: string) {
    this.SelectedSubject.set(subjectId);
    this.Page.set(1);
  }

  clearFilters() {
    this.SearchTerm.set('');
    this.SelectedSubject.set('');
    this.Page.set(1);
  }

  toggleDaFare() {
    this.ShowOnlyPending.update((v) => !v);
    this.Page.set(1);
    this.PageSize.set(this.ShowOnlyPending() ? 500 : 6);
  }

  toggleAutoEval() {
    this.ShowOnlyAutoEval.update((v) => !v);
    this.Page.set(1);
  }

  getAttemptStatus(testId: string): AttemptStatus | null {
    return this.AttemptStatusMap().get(testId) ?? null;
  }

  getAttemptResult(testId: string): { correct: number; wrong: number } | null {
    return this.AttemptResultMap().get(testId) ?? null;
  }

  private checkAttemptStatuses(tests: StudentTestInterface[]): void {
    const toCheck = tests.filter((t) => !this.AttemptStatusMap().has(t._id));
    if (!toCheck.length) return;

    this.IsCheckingStatuses.set(true);

    forkJoin(
      toCheck.map((t) =>
        this.testsService
          .getAttemptByTestId(t._id)
          .pipe(map((attempt) => ({ testId: t._id, attempt }))),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        const statusMap = new Map(this.AttemptStatusMap());
        const resultMap = new Map(this.AttemptResultMap());

        for (const { testId, attempt } of results) {
          if (attempt) {
            statusMap.set(testId, attempt.status);
            const correct = attempt.questions.filter(
              (q) => q.status === 'correct',
            ).length;
            const wrong = attempt.questions.filter(
              (q) =>
                q.status && q.status !== 'correct' && q.status !== 'pending',
            ).length;
            resultMap.set(testId, { correct, wrong });
          }
        }

        this.AttemptStatusMap.set(statusMap);
        this.AttemptResultMap.set(resultMap);
        this.IsCheckingStatuses.set(false);
      });
  }
}
