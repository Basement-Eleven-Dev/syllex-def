import { TitleCasePipe } from '@angular/common';
import { Component, signal, effect, OnDestroy, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { TestCard } from '../../components/test-card/test-card';
import { TestTable } from '../../components/test-table/test-table';
import { RouterModule } from '@angular/router';
import { TestInterface, TestsService } from '../../../services/tests-service';
import { SyllexPagination } from '../../components/syllex-pagination/syllex-pagination';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '../../../services/feedback-service';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';

type TestStatus = 'bozza' | 'pubblicato' | 'archiviato' | '';

@Component({
  selector: 'app-test',
  imports: [
    FontAwesomeModule,
    TestCard,
    TestTable,
    RouterModule,
    TitleCasePipe,
    SyllexPagination,
    FormsModule,
    ViewTypeToggle,
    TourAnchorNgBootstrapDirective,
  ],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class Test implements OnDestroy {
  // Icons
  protected readonly PlusIcon = faPlus;
  protected readonly ClearIcon = faXmark;

  // Dependency Injection
  private testsService = inject(TestsService);
  private feedbackService = inject(FeedbackService);

  // Shared filters
  SearchTerm = signal<string>('');
  Status = signal<TestStatus>('');
  ViewType: ViewType = this.loadViewTypePreference('test') || 'grid';

  // Section: Ultimi test
  RecentTests = signal<TestInterface[]>([]);
  LoadingRecent = signal<boolean>(false);
  CollectionSizeRecent = signal<number>(0);
  PageRecent = signal<number>(1);
  PageSizeRecent = signal<number>(4);

  // Section: Da Correggere
  PendingTests = signal<TestInterface[]>([]);
  LoadingPending = signal<boolean>(false);
  CollectionSizePending = signal<number>(0);
  PagePending = signal<number>(1);
  PageSizePending = signal<number>(4);

  // Private Properties
  private SearchTermSubject = new Subject<string>();
  private Destroy$ = new Subject<void>();

  constructor() {
    this.SearchTermSubject.pipe(
      debounceTime(300),
      takeUntil(this.Destroy$),
    ).subscribe((term: string) => {
      this.SearchTerm.set(term);
    });

    // Effect: Ultimi test (triggers independently on its own page/pageSize)
    effect(() => {
      const searchTerm = this.SearchTerm();
      const status = this.Status();
      const page = this.PageRecent();
      const pageSize = this.PageSizeRecent();
      this.loadRecentTests(
        page,
        pageSize,
        searchTerm || undefined,
        status || undefined,
      );
    });

    // Effect: Da Correggere (triggers independently on its own page/pageSize)
    effect(() => {
      const searchTerm = this.SearchTerm();
      const status = this.Status();
      const page = this.PagePending();
      const pageSize = this.PageSizePending();
      this.loadPendingTests(
        page,
        pageSize,
        searchTerm || undefined,
        status || undefined,
      );
    });
  }

  ngOnDestroy(): void {
    this.Destroy$.next();
    this.Destroy$.complete();
  }

  clearFilters(): void {
    this.SearchTermSubject.next('');
    this.Status.set('');
    this.PageRecent.set(1);
    this.PagePending.set(1);
  }

  onSearchTermChange(value: string): void {
    this.SearchTermSubject.next(value);
    this.PageRecent.set(1);
    this.PagePending.set(1);
  }

  onStatusChange(value: string): void {
    this.Status.set(value as TestStatus);
    this.PageRecent.set(1);
    this.PagePending.set(1);
  }

  onNewRecentPageRequested(newPage: number): void {
    this.PageRecent.set(newPage);
  }

  onRecentPageSizeChange(newPageSize: number): void {
    this.PageSizeRecent.set(newPageSize);
    this.PageRecent.set(1);
  }

  onNewPendingPageRequested(newPage: number): void {
    this.PagePending.set(newPage);
  }

  onPendingPageSizeChange(newPageSize: number): void {
    this.PageSizePending.set(newPageSize);
    this.PagePending.set(1);
  }

  onChangeViewType(type: ViewType): void {
    this.ViewType = type;
  }

  private loadViewTypePreference(pageKey: string): ViewType | null {
    try {
      const saved = localStorage.getItem(`viewType_${pageKey}`);
      return saved === 'grid' || saved === 'table' ? saved : null;
    } catch (error) {
      return null;
    }
  }

  private loadRecentTests(
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: TestStatus,
  ): void {
    this.LoadingRecent.set(true);
    this.testsService
      .getPaginatedTests(page, pageSize, searchTerm, status || undefined)
      .pipe(takeUntil(this.Destroy$))
      .subscribe({
        next: (response) => {
          this.RecentTests.set(response.tests);
          this.CollectionSizeRecent.set(response.total);
          this.LoadingRecent.set(false);
        },
        error: () => {
          this.LoadingRecent.set(false);
        },
      });
  }

  private loadPendingTests(
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: TestStatus,
  ): void {
    this.LoadingPending.set(true);
    this.testsService
      .getPaginatedTests(page, pageSize, searchTerm, status || undefined, true)
      .pipe(takeUntil(this.Destroy$))
      .subscribe({
        next: (response) => {
          this.PendingTests.set(response.tests);
          this.CollectionSizePending.set(response.total);
          this.LoadingPending.set(false);
        },
        error: () => {
          this.LoadingPending.set(false);
        },
      });
  }

  onDeleteTest(testId: string): void {
    this.testsService.deleteTest(testId).subscribe({
      next: () => {
        this.RecentTests.update((tests) =>
          tests.filter((t) => t._id !== testId),
        );
        this.CollectionSizeRecent.update((size) => size - 1);
        const wasInPending = this.PendingTests().some((t) => t._id === testId);
        if (wasInPending) {
          this.PendingTests.update((tests) =>
            tests.filter((t) => t._id !== testId),
          );
          this.CollectionSizePending.update((size) => size - 1);
        }
        this.feedbackService.showFeedback('Test eliminato con successo', true);
      },
      error: (err: Error) => {
        console.error('Errore durante la cancellazione del test:', err);
        this.feedbackService.showFeedback(
          'Errore durante la cancellazione del test',
          false,
        );
      },
    });
  }

  onDuplicateTest(testId: string): void {
    this.testsService.duplicateTest(testId).subscribe({
      next: (response) => {
        this.RecentTests.update((tests) => [response.test, ...tests]);
        this.CollectionSizeRecent.update((size) => size + 1);
        this.feedbackService.showFeedback('Test duplicato con successo', true);
      },
      error: (err: Error) => {
        console.error('Errore durante la duplicazione del test:', err);
        this.feedbackService.showFeedback(
          'Errore durante la duplicazione del test',
          false,
        );
      },
    });
  }

  onPublishTest(testId: string): void {
    this.testsService.publishTest(testId).subscribe({
      next: () => {
        const updater = (tests: TestInterface[]) =>
          tests.map((t) =>
            t._id === testId ? { ...t, status: 'pubblicato' as const } : t,
          );
        this.RecentTests.update(updater);
        this.PendingTests.update(updater);
        this.feedbackService.showFeedback('Test pubblicato con successo', true);
      },
      error: (err: Error) => {
        console.error('Errore durante la pubblicazione del test:', err);
        this.feedbackService.showFeedback(
          'Errore durante la pubblicazione del test',
          false,
        );
      },
    });
  }
}
