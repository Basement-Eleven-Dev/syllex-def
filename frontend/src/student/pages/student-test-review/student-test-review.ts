import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronUp,
  faChevronDown,
  faCircleCheck,
  faClock,
  faHashtag,
  faPen,
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
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-student-test-review',
  standalone: true,
  imports: [FontAwesomeModule, BackTo, QuestionCard, TranslocoDirective],
  templateUrl: './student-test-review.html',
  styleUrl: './student-test-review.scss',
})
export class StudentTestReview implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly testsService = inject(StudentTestsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLElement>;

  readonly SpinnerIcon = faSpinnerThird;
  readonly ClockIcon = faClock;
  readonly CorrectIcon = faCheck;
  readonly WrongIcon = faXmark;
  readonly QuestionsIcon = faHashtag;
  readonly AnswersIcon = faPen;
  readonly ScoreIcon = faScaleBalanced;
  readonly StatusIcon = faCircleCheck;

  readonly ChevronUp = faChevronUp;
  readonly ChevronDown = faChevronDown;

  private readonly TestId = this.route.snapshot.paramMap.get('testId')!;

  readonly Attempt = signal<StudentAttemptInterface | null>(null);
  readonly IsLoading = signal(true);
  readonly Error = signal<string | null>(null);
  readonly ActiveIndex = signal(0);
  readonly KpiExpanded = signal(false);

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
        return this.translocoService.translate(
          'student_test_review.status_in_progress',
        );
      case 'delivered':
        return this.translocoService.translate(
          'student_test_review.status_delivered',
        );
      case 'reviewed':
        return this.IsAutoEvaluation()
          ? this.translocoService.translate(
              'student_test_review.status_reviewed_ai',
            )
          : this.translocoService.translate(
              'student_test_review.status_reviewed_teacher',
            );
      default:
        return this.translocoService.translate(
          'student_test_review.status_unknown',
        );
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
    this.IsAutoEvaluation()
      ? this.translocoService.translate('student_test_review.feedback_label_ai')
      : this.translocoService.translate(
          'student_test_review.feedback_label_teacher',
        ),
  );

  ngOnInit(): void {
    this.loadAttempt();
  }

  ngAfterViewInit(): void {
    this._attachScrollListeners();
  }

  ngOnDestroy(): void {
    const vp = this.viewportRef?.nativeElement;
    if (!vp) return;
    vp.removeEventListener('wheel', this._onWheel);
    vp.removeEventListener('scrollend', this._syncOnScrollEnd);
    vp.removeEventListener('scroll', this._syncOnScrollThrottle);
    vp.removeEventListener('mousedown', this._onMouseDown);
    vp.removeEventListener('mousemove', this._onMouseMove);
    vp.removeEventListener('mouseup', this._onMouseUpOrLeave);
    vp.removeEventListener('mouseleave', this._onMouseUpOrLeave);
  }

  private _wheelCooldown = false;
  private _syncScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private _listenersAttached = false;

  private _isDragging = false;
  private _startY = 0;
  private _scrollTop = 0;

  /** True when viewport width is at or below the mobile breakpoint. */
  private get _isMobile(): boolean {
    return window.innerWidth <= 767;
  }

  private _attachScrollListeners(): void {
    if (this._listenersAttached) return;
    const vp = this.viewportRef?.nativeElement;
    if (!vp) return;
    vp.addEventListener('wheel', this._onWheel, { passive: false });
    vp.addEventListener('scrollend', this._syncOnScrollEnd);
    vp.addEventListener('scroll', this._syncOnScrollThrottle);
    vp.addEventListener('mousedown', this._onMouseDown);
    vp.addEventListener('mousemove', this._onMouseMove);
    vp.addEventListener('mouseup', this._onMouseUpOrLeave);
    vp.addEventListener('mouseleave', this._onMouseUpOrLeave);
    this._listenersAttached = true;
  }

  private readonly _onMouseDown = (e: MouseEvent): void => {
    if (this._isMobile) return;
    const vp = this.viewportRef?.nativeElement;
    if (!vp) return;
    this._isDragging = true;
    vp.classList.add('grabbing');
    this._startY = e.pageY - vp.offsetTop;
    this._scrollTop = vp.scrollTop;
  };

  private readonly _onMouseMove = (e: MouseEvent): void => {
    if (!this._isDragging) return;
    const vp = this.viewportRef?.nativeElement;
    if (!vp) return;
    e.preventDefault();
    const y = e.pageY - vp.offsetTop;
    const walk = (y - this._startY) * 1.5; // adjust scrolling speed ratio
    vp.scrollTop = this._scrollTop - walk;
  };

  private readonly _onMouseUpOrLeave = (): void => {
    if (!this._isDragging) return;
    this._isDragging = false;
    const vp = this.viewportRef?.nativeElement;
    if (vp) {
      vp.classList.remove('grabbing');
    }
    this._syncIndexFromScroll();
    this._scrollToActive();
  };

  // Fires when scroll animation fully settles (modern browsers)
  private readonly _syncOnScrollEnd = (): void => {
    if (this._syncScrollTimer) clearTimeout(this._syncScrollTimer);
    this._syncIndexFromScroll();
  };

  // Debounced fallback for browsers without scrollend
  private readonly _syncOnScrollThrottle = (): void => {
    if (this._syncScrollTimer) clearTimeout(this._syncScrollTimer);
    this._syncScrollTimer = setTimeout(
      () => this._syncIndexFromScroll(),
      this._isMobile ? 80 : 400,
    );
  };

  private _syncIndexFromScroll(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const slides = Array.from(
      viewport.querySelectorAll('.review-slide'),
    ) as HTMLElement[];
    const vr = viewport.getBoundingClientRect();
    const vpCenter = vr.top + vr.height / 2;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < slides.length; i++) {
      const sr = slides[i].getBoundingClientRect();
      const dist = Math.abs(sr.top + sr.height / 2 - vpCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    this.ActiveIndex.set(closest);
  }

  private readonly _onWheel = (e: WheelEvent): void => {
    if (this._isMobile) return;
    e.preventDefault();
    if (this._wheelCooldown) return;
    if (e.deltaY > 0) this.next();
    else if (e.deltaY < 0) this.prev();
    this._wheelCooldown = true;
    setTimeout(() => {
      this._wheelCooldown = false;
    }, 650);
  };

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
    if (this._isMobile) return;
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const slides = Array.from(
      viewport.querySelectorAll('.review-slide'),
    ) as HTMLElement[];
    const slide = slides[this.ActiveIndex()];
    if (!slide) return;
    const sr = slide.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    const targetTop =
      viewport.scrollTop + sr.top - vr.top - (vr.height - sr.height) / 2;
    viewport.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  private loadAttempt(): void {
    this.testsService
      .getAttemptByTestId(this.TestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (attempt) => {
          if (!attempt || attempt.status === 'in-progress') {
            this.Error.set(
              this.translocoService.translate(
                'student_test_review.no_attempt_found',
              ),
            );
          } else {
            this.Attempt.set(attempt);
          }
          this.IsLoading.set(false);
          setTimeout(() => this._attachScrollListeners());
        },
        error: () => {
          this.Error.set(
            this.translocoService.translate(
              'student_test_review.attempt_load_error',
            ),
          );
          this.IsLoading.set(false);
        },
      });
  }
}
