import { Component, signal, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBroom } from '@fortawesome/pro-solid-svg-icons';
import {
  StudentTestInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-student-tests-list',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, DatePipe, TitleCasePipe],
  templateUrl: './student-tests-list.html',
  styleUrl: './student-tests-list.scss',
})
export class StudentTestsList implements OnInit {
  private readonly testsService = inject(StudentTestsService);
  private readonly router = inject(Router);

  readonly ClearIcon = faBroom;
  readonly Tests = signal<StudentTestInterface[]>([]);
  readonly SearchTerm = signal('');

  ngOnInit() {
    this.loadTests();
  }

  loadTests() {
    this.testsService.getAvailableTests(this.SearchTerm()).subscribe({
      next: (tests) => this.Tests.set(tests),
      error: (err) => {
        console.error('Errore nel caricamento dei test:', err);
        this.Tests.set([]);
      },
    });
  }

  onSearchTermChange(term: string) {
    this.SearchTerm.set(term);
    this.loadTests();
  }

  clearFilters() {
    this.SearchTerm.set('');
    this.loadTests();
  }
}
