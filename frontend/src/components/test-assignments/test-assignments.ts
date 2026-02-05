import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckDouble, faEye } from '@fortawesome/pro-solid-svg-icons';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';

interface TestAssignment {
  id: number;
  studenteName: string;
  studentSurname: string;
  class: string;
  score: number | null;
  deliveredAt: Date | null;
}

@Component({
  selector: 'app-test-assignments',
  imports: [
    FontAwesomeModule,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterLink,
  ],
  templateUrl: './test-assignments.html',
  styleUrl: './test-assignments.scss',
})
export class TestAssignments {
  EyeIcon = faEye;
  ChecksIcon = faCheckDouble;

  filtersForm: FormGroup = new FormGroup({
    text: new FormControl(''),
    class: new FormControl(''),
    status: new FormControl(''),
  });

  testAssignments: TestAssignment[] = [
    {
      id: 1,
      studenteName: 'Mario',
      studentSurname: 'Rossi',
      class: '3A',
      score: 85,
      deliveredAt: new Date('2024-05-10T10:30:00'),
    },
    {
      id: 2,
      studenteName: 'Luigi',
      studentSurname: 'Verdi',
      class: '3B',
      score: null,
      deliveredAt: null,
    },
  ];

  page: number = 1;
  pageSize: number = 5;
  collectionSize: number = this.testAssignments.length;
  onNewPageRequested() {}
}
