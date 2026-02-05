import { NgClass, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { TestCard } from '../../components/test-card/test-card';
import { TestTable } from '../../components/test-table/test-table';
import { RouterModule } from '@angular/router';
import { TestsService } from '../../services/tests-service';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';

type StatusType = 'bozza' | 'pubblicato' | 'archiviato';
export interface TestData {
  id: string;
  title: string;
  status: StatusType;
  availableDate: [Date, Date] | null; // null means always available
  questionsCount: number;
  maxScore: number;
  classesAssigned: string[];
  hasPendingCorrections: number | null; // null means no corrections needed
}

@Component({
  selector: 'app-test',
  imports: [
    FontAwesomeModule,
    NgClass,
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

  constructor(private testsService: TestsService) {}

  tests: TestData[] = [
    {
      id: '1',
      title: 'Math Test 1',
      status: 'bozza',
      availableDate: [new Date('2024-01-01'), new Date('2024-01-31')],
      questionsCount: 20,
      maxScore: 100,
      classesAssigned: ['Class A', 'Class B', 'Class C', 'Class D'],
      hasPendingCorrections: 5,
    },
    {
      id: '2',
      title: 'Math Test 1',
      status: 'pubblicato',
      availableDate: [new Date('2024-01-01'), new Date('2024-01-31')],
      questionsCount: 20,
      maxScore: 100,
      classesAssigned: ['Class A', 'Class B', 'Class C', 'Class D'],
      hasPendingCorrections: 0,
    },
  ];

  loading: boolean = false;
  onNewPageRequested() {
    this.testsService.getPaginatedTests(this.page, this.pageSize).subscribe({
      next: (response) => {
        this.tests = response.tests;
        this.collectionSize = response.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
    this.loading = true;
  }

  collectionSize = 10;
  page = 1;
  pageSize = 5;

  viewType: ViewType = 'grid';
  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }
}
