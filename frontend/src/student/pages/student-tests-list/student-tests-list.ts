import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBroom } from '@fortawesome/pro-solid-svg-icons';
import {
  StudentTestInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { StudentTestCard } from '../../components/student-test-card/student-test-card';

type AttemptStatus = 'in-progress' | 'delivered' | 'reviewed';

@Component({
  selector: 'app-student-tests-list',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, StudentTestCard],
  templateUrl: './student-tests-list.html',
  styleUrl: './student-tests-list.scss',
})
export class StudentTestsList implements OnInit {
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ClearIcon = faBroom;

  readonly Tests = signal<StudentTestInterface[]>([]);
  readonly AttemptStatusMap = signal<Map<string, AttemptStatus>>(new Map());
  readonly SearchTerm = signal('');

  ngOnInit() {
    this.loadTests();
  }

  loadTests() {
    this.testsService
      .getAvailableTests(this.SearchTerm())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tests) => {
          this.Tests.set(tests);
          this.checkAttemptStatuses(tests);
        },
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

  getAttemptStatus(testId: string): AttemptStatus | null {
    return this.AttemptStatusMap().get(testId) ?? null;
  }

  private checkAttemptStatuses(tests: StudentTestInterface[]): void {
    for (const test of tests) {
      this.testsService
        .getAttemptByTestId(test._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (attempt) => {
            if (attempt) {
              this.AttemptStatusMap.update((map) => {
                const updated = new Map(map);
                updated.set(test._id, attempt.status);
                return updated;
              });
            }
          },
        });
    }
  }
}
