import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCircle,
  faQuestion,
  faScaleBalanced,
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
  imports: [FontAwesomeModule, BackTo, QuestionCard],
  templateUrl: './student-test-review.html',
  styleUrl: './student-test-review.scss',
})
export class StudentTestReview implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLElement>;

  readonly SpinnerIcon = faSpinnerThird;
  readonly ClockIcon = faClock;
  readonly CorrectIcon = faCheck;
  readonly WrongIcon = faXmark;
  readonly QuestionIcon = faQuestion;
  readonly CircleIcon = faCircle;
  readonly ChevronLeft = faChevronLeft;
  readonly ChevronRight = faChevronRight;
  readonly ScaleIcon = faScaleBalanced;

  private readonly TestId = this.route.snapshot.paramMap.get('testId')!;

  readonly Attempt = signal<StudentAttemptInterface | null>(null);
  readonly IsLoading = signal(true);
  readonly Error = signal<string | null>(null);
  readonly ActiveIndex = signal(0);

  readonly IsAutoEvaluation = computed(
    () => this.Attempt()?.source === 'self-evaluation',
  );

  readonly FormattedTimeSpent = computed(() => {
    const seconds = this.Attempt()?.timeSpent ?? 0;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly Status = computed(() => {
    const status = this.Attempt()?.status;
    switch (status) {
      case 'in-progress':
        return 'Incompleto';
      case 'delivered':
        return 'Consegnato';
      case 'reviewed':
        return this.IsAutoEvaluation()
          ? "Corretto dall'AI di Syllex"
          : 'Corretto dal docente';
      default:
        return 'Sconosciuto';
    }
  });

  readonly AnsweredCount = computed(() => {
    const questions = this.Attempt()?.questions ?? [];
    return questions.filter(
      (q) => q.answer !== null && q.answer !== undefined && q.answer !== '',
    ).length;
  });

  readonly CorrectCount = computed(
    () =>
      this.Attempt()?.questions.filter((q) => q.status === 'correct').length ??
      0,
  );

  readonly WrongCount = computed(
    () =>
      this.Attempt()?.questions.filter(
        (q) => q.status === 'wrong' || q.status === 'incorrect',
      ).length ?? 0,
  );

  readonly SemiCorrectCount = computed(
    () =>
      this.Attempt()?.questions.filter(
        (q) => q.status === 'semi-correct' || q.status === 'partial',
      ).length ?? 0,
  );

  readonly EmptyCount = computed(
    () => this.Attempt()?.questions.filter((q) => !q.status).length ?? 0,
  );

  readonly Score = computed(() =>
    this.Attempt()
      ?.questions.reduce((sum, q) => sum + (q.score ?? 0), 0)
      .toFixed(1),
  );

  readonly MaxScore = computed(() =>
    this.Attempt()
      ?.questions.reduce((sum, q) => sum + (q.points ?? 0), 0)
      .toFixed(1),
  );

  readonly FeedbackLabel = computed(() =>
    this.IsAutoEvaluation() ? "Commento dell'AI" : 'Commento del docente',
  );

  ngOnInit(): void {
    this.loadAttempt();
  }

  ngAfterViewInit(): void {
    // viewport is empty until attempt loads — scroll happens after data arrives
  }

  prev(): void {
    if (this.ActiveIndex() > 0) {
      this.ActiveIndex.update((i) => i - 1);
      this._scrollToActive();
    }
  }

  next(): void {
    const max = (this.Attempt()?.questions.length ?? 1) - 1;
    if (this.ActiveIndex() < max) {
      this.ActiveIndex.update((i) => i + 1);
      this._scrollToActive();
    }
  }

  goTo(index: number): void {
    if (index === this.ActiveIndex()) return;
    this.ActiveIndex.set(index);
    this._scrollToActive();
  }

  private _scrollToActive(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const slides = Array.from(
      viewport.querySelectorAll('.review-slide'),
    ) as HTMLElement[];
    const slide = slides[this.ActiveIndex()];
    if (!slide) return;
    const sr = slide.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    const targetLeft =
      viewport.scrollLeft + sr.left - vr.left - (vr.width - sr.width) / 2;
    viewport.scrollTo({ left: targetLeft, behavior: 'smooth' });
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
