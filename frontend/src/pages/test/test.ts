import { TitleCasePipe } from '@angular/common';
import { Component, signal, effect, OnDestroy, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { TestCard } from '../../components/test-card/test-card';
import { TestTable } from '../../components/test-table/test-table';
import { RouterModule } from '@angular/router';
import { TestInterface, TestsService } from '../../services/tests-service';
import { SyllexPagination } from '../../components/syllex-pagination/syllex-pagination';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';
import { debounceTime, Subject, takeUntil } from 'rxjs';

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

  // Signals
  Tests = signal<TestInterface[]>([]);
  Loading = signal<boolean>(false);
  CollectionSize = signal<number>(0);
  Page = signal<number>(1);
  PageSize = signal<number>(10);
  SearchTerm = signal<string>('');
  Status = signal<TestStatus>('');
  ViewType: ViewType = this.loadViewTypePreference('test') || 'grid';

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

    effect(() => {
      const currentSearchTerm = this.SearchTerm();
      const currentStatus = this.Status();
      const currentPage = this.Page();
      const currentPageSize = this.PageSize();

      this.loadTests(
        currentPage,
        currentPageSize,
        currentSearchTerm || undefined,
        currentStatus || undefined,
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
    this.Page.set(1);
  }
  onSearchTermChange(value: string): void {
    this.SearchTermSubject.next(value);
    this.Page.set(1);
  }

  onStatusChange(value: string): void {
    this.Status.set(value as TestStatus);
    this.Page.set(1);
  }

  onNewPageRequested(newPage: number): void {
    this.Page.set(newPage);
  }

  onPageSizeChange(newPageSize: number): void {
    this.PageSize.set(newPageSize);
    this.Page.set(1);
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

  onDeleteTest(testId: string): void {
    this.testsService.deleteTest(testId).subscribe({
      next: () => {
        this.removeTestFromList(testId);
      },
      error: (err: Error) => {
        console.error('Errore durante la cancellazione del test:', err);
      },
    });
  }

  // Metodi privati
  private loadTests(
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: TestStatus,
  ): void {
    this.Loading.set(true);
    this.testsService
      .getPaginatedTests(
        page,
        pageSize,
        searchTerm || undefined,
        status || undefined,
      )
      .pipe(takeUntil(this.Destroy$))
      .subscribe({
        next: (response) => {
          this.Tests.set(response.tests);
          this.CollectionSize.set(response.total);
          this.Loading.set(false);
        },
        error: () => {
          this.Loading.set(false);
        },
      });
  }

  private removeTestFromList(testId: string): void {
    this.Tests.update((tests) => tests.filter((t) => t._id !== testId));
    this.CollectionSize.update((size) => size - 1);
  }
}
