import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faClock,
  faSpinnerThird,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import {
  StudentAttemptInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { BackTo } from '../../../teacher/components/back-to/back-to';
import { QuestionCard } from '../../../teacher/components/question-card/question-card';

@Component({
  selector: 'app-student-test-review',
  standalone: true,
  imports: [FontAwesomeModule, BackTo, QuestionCard, DatePipe],
  templateUrl: './student-test-review.html',
  styleUrl: './student-test-review.scss',
})
export class StudentTestReview implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly SpinnerIcon = faSpinnerThird;
  readonly ClockIcon = faClock;
  readonly CorrectIcon = faCheck;
  readonly WrongIcon = faXmark;

  private readonly TestId = this.route.snapshot.paramMap.get('testId')!;

  readonly Attempt = signal<StudentAttemptInterface | null>(null);
  readonly IsLoading = signal(true);
  readonly Error = signal<string | null>(null);

  readonly FormattedTimeSpent = computed(() => {
    const seconds = this.Attempt()?.timeSpent ?? 0;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly AnsweredCount = computed(() => {
    const questions = this.Attempt()?.questions ?? [];
    return questions.filter(
      (q) => q.answer !== null && q.answer !== undefined && q.answer !== '',
    ).length;
  });

  ngOnInit(): void {
    this.loadAttempt();
  }

  getSelectedAnswer(questionId: string): number | string | null {
    const attemptQuestion = this.Attempt()?.questions.find(
      (q) => q.question._id === questionId,
    );
    return attemptQuestion?.answer ?? null;
  }

  private loadAttempt(): void {
    this.testsService
      .getAttemptByTestId(this.TestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (attempt) => {
          if (!attempt || attempt.status === 'in-progress') {
            this.Error.set(
              'Nessun tentativo consegnato trovato per questo test.',
            );
          } else {
            this.Attempt.set(attempt);
          }
          this.IsLoading.set(false);
        },
        error: () => {
          this.Error.set('Errore nel caricamento del tentativo.');
          this.IsLoading.set(false);
        },
      });
  }
}
