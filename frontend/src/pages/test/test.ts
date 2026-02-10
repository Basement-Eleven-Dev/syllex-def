import { TitleCasePipe } from '@angular/common';
import { Component, signal, effect } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { TestCard } from '../../components/test-card/test-card';
import { TestTable } from '../../components/test-table/test-table';
import { RouterModule } from '@angular/router';
import { TestInterface, TestsService } from '../../services/tests-service';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';

@Component({
  selector: 'app-test',
  imports: [
    FontAwesomeModule,
    TestCard,
    TestTable,
    RouterModule,
    TitleCasePipe,
    NgbPagination,
    FormsModule,
    ViewTypeToggle,
  ],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class Test {
  PlusIcon = faPlus;

  // Signals per state management
  tests = signal<TestInterface[]>([]);
  loading = signal<boolean>(false);
  collectionSize = signal(0);
  page = signal(1);
  pageSize = signal(10);

  // Filter signals
  searchTerm = signal<string>('');
  status = signal<'bozza' | 'pubblicato' | 'archiviato' | ''>('');

  viewType: ViewType = 'grid';

  constructor(private testsService: TestsService) {
    // Effect che triggera il load quando cambiano filtri o paginazione
    effect(() => {
      const currentSearchTerm = this.searchTerm();
      const currentStatus = this.status();
      const currentPage = this.page();
      const currentPageSize = this.pageSize();

      this.loadTests(
        currentPage,
        currentPageSize,
        currentSearchTerm || undefined,
        currentStatus || undefined,
      );
    });
  }

  private loadTests(
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: 'bozza' | 'pubblicato' | 'archiviato',
  ): void {
    this.loading.set(true);
    this.testsService
      .getPaginatedTests(
        page,
        pageSize,
        searchTerm || undefined,
        status || undefined,
      )
      .subscribe({
        next: (response) => {
          this.tests.set(response.tests);
          this.collectionSize.set(response.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1); // Reset pagina quando cambiano i filtri
  }

  onStatusChange(value: string): void {
    this.status.set(value as 'bozza' | 'pubblicato' | 'archiviato' | '');
    this.page.set(1); // Reset pagina quando cambiano i filtri
  }

  onNewPageRequested(newPage: number): void {
    this.page.set(newPage);
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize.set(newPageSize);
    this.page.set(1); // Reset pagina quando cambia pageSize
  }

  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }
}
