import { Component, signal, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBroom, faPlus } from '@fortawesome/pro-solid-svg-icons';
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
  ],
  templateUrl: './student-tests-list.html',
  styleUrl: './student-tests-list.scss',
})
export class StudentTestsList {
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly materiaService = inject(Materia);
  private readonly feedbackService = inject(FeedbackService);

  readonly ClearIcon = faBroom;
  readonly PlusIcon = faPlus;

  readonly Tests = signal<StudentTestInterface[]>([]);
  readonly AttemptStatusMap = signal<Map<string, AttemptStatus>>(new Map());
  readonly SearchTerm = signal('');
  readonly SelectedSubject = signal('');

  // Pagination
  readonly Page = signal(1);
  readonly PageSize = signal(10);
  readonly CollectionSize = signal(0);

  readonly Subjects = this.materiaService.allMaterie;

  constructor() {
    effect(() => {
      this.loadTests();
    });
  }

  loadTests() {
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
          this.Tests.set(res.tests);
          this.CollectionSize.set(res.total);
          this.checkAttemptStatuses(res.tests);
        },
        error: (err) => {
          console.error('Errore nel caricamento dei test:', err);
          this.feedbackService.showFeedback(
            'Errore nel caricamento dei test',
            false,
          );
          this.Tests.set([]);
          this.CollectionSize.set(0);
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

  getAttemptStatus(testId: string): AttemptStatus | null {
    return this.AttemptStatusMap().get(testId) ?? null;
  }

  private checkAttemptStatuses(tests: StudentTestInterface[]): void {
    for (const test of tests) {
      if (this.AttemptStatusMap().has(test._id)) continue;
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
