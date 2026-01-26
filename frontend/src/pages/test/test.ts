import { NgClass, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGrid, faList, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { TestCard } from '../../components/test-card/test-card';
import { TestTable } from '../../components/test-table/test-table';
import { RouterModule } from '@angular/router';

type StatusType = 'bozza' | 'pubblicato' | 'archiviato';
export interface TestData {
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
  ],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class Test {
  PlusIcon = faPlus;

  ListIcon = faList;
  GridIcon = faGrid;

  tests: TestData[] = [
    {
      title: 'Math Test 1',
      status: 'bozza',
      availableDate: [new Date('2024-01-01'), new Date('2024-01-31')],
      questionsCount: 20,
      maxScore: 100,
      classesAssigned: ['Class A', 'Class B', 'Class C', 'Class D'],
      hasPendingCorrections: 5,
    },
    {
      title: 'Math Test 1',
      status: 'pubblicato',
      availableDate: [new Date('2024-01-01'), new Date('2024-01-31')],
      questionsCount: 20,
      maxScore: 100,
      classesAssigned: ['Class A', 'Class B', 'Class C', 'Class D'],
      hasPendingCorrections: 0,
    },
  ];

  viewType: 'list' | 'grid' = 'grid';
  onChangeViewType(value: 'list' | 'grid') {
    this.viewType = value;
  }
}
