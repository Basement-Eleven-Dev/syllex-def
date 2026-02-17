import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, catchError, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faClock,
  faPlay,
  faRotateRight,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import {
  QuestionInterface,
  QuestionsService,
} from '../../../services/questions';
import {
  StudentAttemptInterface,
  StudentTestInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { FeedbackService } from '../../../services/feedback-service';
import { BackTo } from '../../../teacher/components/back-to/back-to';
import { QuestionCard } from '../../../teacher/components/question-card/question-card';
import { CanDeactivateComponent } from '../../../guards/test-execution.guard';

@Component({
  selector: 'app-student-test-execution',
  standalone: true,
  imports: [FontAwesomeModule, BackTo, QuestionCard, DatePipe],
  templateUrl: './student-test-execution.html',
  styleUrl: './student-test-execution.scss',
})
export class StudentTestExecution implements OnInit, CanDeactivateComponent {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly questionsService = inject(QuestionsService);
  private readonly testsService = inject(StudentTestsService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  // Icons
  readonly ClockIcon = faClock;
  readonly SpinnerIcon = faSpinnerThird;
  readonly PlayIcon = faPlay;
  readonly BackIcon = faArrowLeft;
  readonly ResumeIcon = faRotateRight;

  // State
  private readonly TestId = this.route.snapshot.paramMap.get('testId')!;

  readonly TestData = signal<StudentTestInterface | null>(null);
  readonly Questions = signal<QuestionInterface[]>([]);
  readonly Answers = signal<Record<string, number | string>>({});
  readonly IsLoading = signal(true);
  readonly IsSubmitting = signal(false);
  readonly Error = signal<string | null>(null);
  readonly RemainingSeconds = signal(0);
  readonly TestStarted = signal(false);
  readonly IsResuming = signal(false);

  private CurrentAttempt = signal<StudentAttemptInterface | null>(null);

  // Debounced auto-save
  private readonly saveSubject = new Subject<void>();

  // Computed
  readonly HasTimeLimit = computed(() => (this.TestData()?.timeLimit ?? 0) > 0);
  readonly TimerExpired = computed(
    () => this.HasTimeLimit() && this.RemainingSeconds() <= 0,
  );
  readonly FormattedTime = computed(() => {
    const total = this.RemainingSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });
  readonly AnsweredCount = computed(() => {
    const answers = this.Answers();
    return Object.values(answers).filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length;
  });
  readonly HasDeadline = computed(() => !!this.TestData()?.availableTo);
  readonly DeadlineDate = computed(() => {
    const d = this.TestData()?.availableTo;
    return d ? new Date(d) : null;
  });

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private IsSubmitted = signal(false);

  canDeactivate(): boolean {
    return !this.TestStarted() || this.IsSubmitted();
  }

  ngOnInit(): void {
    this.initAutoSave();
    this.loadTestAndQuestions();
  }

  onStartTest(): void {
    this.TestStarted.set(true);
    if (this.IsResuming()) {
      this.restoreFromAttempt(this.CurrentAttempt()!);
    } else {
      this.createAttemptOnDb();
    }
  }

  onAnswerChange(questionId: string, value: number | string): void {
    this.Answers.update((a) => ({ ...a, [questionId]: value }));
    this.scheduleSave();
  }

  onSubmit(): void {
    const attempt = this.CurrentAttempt();
    if (!attempt?._id) return;

    this.IsSubmitting.set(true);

    // Final save (questions + timeSpent only), then submit
    const finalData = this.buildAttemptUpdatePayload();

    this.testsService
      .updateAttempt(attempt._id, finalData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.testsService
            .submitTestAttempt(attempt._id!)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.IsSubmitting.set(false);
                this.IsSubmitted.set(true);
                this.stopTimer();
                this.feedbackService.showFeedback(
                  'Test consegnato con successo!',
                  true,
                );
                this.router.navigate(['/s/tests']);
              },
              error: (err) => {
                this.IsSubmitting.set(false);
                this.feedbackService.showFeedback(
                  "Errore nell'invio del test: " + (err?.message || err),
                  false,
                );
              },
            });
        },
        error: (err) => {
          this.IsSubmitting.set(false);
          this.feedbackService.showFeedback(
            'Errore nel salvataggio finale: ' + (err?.message || err),
            false,
          );
        },
      });
  }

  onGoBack(): void {
    this.router.navigate(['/s/tests']);
  }

  // --- Private ---

  private initAutoSave(): void {
    this.saveSubject
      .pipe(debounceTime(5000), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.persistAttemptToDb());
  }

  private scheduleSave(): void {
    this.saveSubject.next();
  }

  private loadTestAndQuestions(): void {
    this.IsLoading.set(true);
    this.Error.set(null);

    this.testsService
      .getAvailableTests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tests) => {
          const found = tests.find((t) => t._id === this.TestId);
          if (!found) {
            this.Error.set('Test non trovato');
            this.IsLoading.set(false);
            return;
          }
          this.TestData.set(found);
          this.loadQuestions(found);
        },
        error: () => {
          this.Error.set('Errore nel caricamento del test');
          this.IsLoading.set(false);
        },
      });
  }

  private loadQuestions(test: StudentTestInterface): void {
    const questionIds = this.extractQuestionIds(test);
    if (!questionIds.length) {
      this.IsLoading.set(false);
      this.checkExistingAttempt();
      return;
    }

    const requests = questionIds.map((id) =>
      this.questionsService.loadQuestion(id).pipe(catchError(() => of(null))),
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const loaded = results.filter(
            (q): q is QuestionInterface => q !== null,
          );
          loaded.sort(
            (a, b) => questionIds.indexOf(a._id) - questionIds.indexOf(b._id),
          );
          this.Questions.set(loaded);
          this.IsLoading.set(false);
          this.checkExistingAttempt();
        },
        error: () => {
          this.Error.set('Errore nel caricamento delle domande');
          this.IsLoading.set(false);
        },
      });
  }

  private checkExistingAttempt(): void {
    this.testsService
      .getAttemptByTestId(this.TestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (attempt) => {
          if (attempt && attempt.status === 'in-progress') {
            this.CurrentAttempt.set(attempt);
            this.IsResuming.set(true);
          }
        },
        error: () => {
          // No existing attempt — show pre-start screen
        },
      });
  }

  private restoreFromAttempt(attempt: StudentAttemptInterface): void {
    // Restore answers from attempt questions
    const answers: Record<string, number | string> = {};
    for (const q of attempt.questions) {
      if (q.answer !== null && q.answer !== undefined) {
        answers[q.question._id] = q.answer;
      }
    }
    this.Answers.set(answers);

    const startedAt = new Date(attempt.startedAt).getTime();
    this.startTimer(this.TestData()?.timeLimit, startedAt);
  }

  private createAttemptOnDb(): void {
    const test = this.TestData();
    const questions = this.Questions();
    if (!test) return;

    const attempt: StudentAttemptInterface = {
      testId: test._id,
      subjectId: test.subjectId || questions[0]?.subjectId,
      teacherId: test.teacherId || questions[0]?.teacherId,
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      timeSpent: 0,
      questions: questions.map((q) => ({
        question: q,
        answer: null,
      })),
    };

    this.testsService
      .createAttempt(attempt)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.CurrentAttempt.set(created);
          const startedAt = new Date(created.startedAt).getTime();
          this.startTimer(test.timeLimit, startedAt);
        },
        error: (err) => {
          this.feedbackService.showFeedback(
            "Errore nell'avvio del test: " + (err?.message || err),
            false,
          );
          this.TestStarted.set(false);
        },
      });
  }

  private persistAttemptToDb(): void {
    const attempt = this.CurrentAttempt();
    if (!attempt?._id) return;

    const payload = this.buildAttemptUpdatePayload();

    this.testsService
      .updateAttempt(attempt._id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.CurrentAttempt.set(updated),
        error: () => {
          // Silent fail — will retry on next debounce
        },
      });
  }

  private buildAttemptUpdatePayload(): Partial<StudentAttemptInterface> {
    const attempt = this.CurrentAttempt();
    const startedAt = attempt
      ? new Date(attempt.startedAt).getTime()
      : Date.now();
    const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
    const answers = this.Answers();
    const questions = this.Questions();

    return {
      timeSpent,
      questions: questions.map((q) => ({
        question: q,
        answer: answers[q._id] ?? null,
      })),
    };
  }

  private extractQuestionIds(test: StudentTestInterface): string[] {
    return (
      test.questions?.map((q) => {
        if (typeof q.questionId === 'object' && '$oid' in q.questionId) {
          return q.questionId.$oid;
        }
        return q.questionId as string;
      }) ?? []
    );
  }

  private startTimer(timeLimitMinutes?: number, startedAt?: number): void {
    if (!timeLimitMinutes || timeLimitMinutes <= 0) return;

    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const remaining = Math.max(timeLimitMinutes * 60 - elapsed, 0);
    this.RemainingSeconds.set(remaining);

    if (remaining <= 0) return;

    this.timerInterval = setInterval(() => {
      this.RemainingSeconds.update((s) => {
        if (s <= 1) {
          this.stopTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    this.destroyRef.onDestroy(() => this.stopTimer());
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
