import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartLine,
  faPencilAlt,
  faSpinnerThird,
  faTrash,
  faUsers,
  faPaperPlane,
  faChartBar,
  faCheckCircle,
  faPenNib,
  faPrint,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TestPrintModal } from '../../components/test-print-modal/test-print-modal';
import { TestResultsPrintModal } from '../../components/test-results-print-modal/test-results-print-modal';
import { QuestionsService } from '../../../services/questions';
import { forkJoin, switchMap, of, tap } from 'rxjs';
import { BackTo } from '../../components/back-to/back-to';
import { StatCard, StatCardData } from '../../components/stat-card/stat-card';
import { TestAssignments } from '../../components/test-assignments/test-assignments';
import { TestStats } from '../../components/test-stats/test-stats';
import { FeedbackService } from '../../../services/feedback-service';
import { TestsService } from '../../../services/tests-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TestAiSummaryComponent } from '../../components/test-ai-summary/test-ai-summary';

// Mappatura icone: associa le stringhe del backend agli oggetti FontAwesome
const IconMap: Record<string, any> = {
  'paper-plane': faPaperPlane,
  'chart-bar': faChartBar,
  'check-circle': faCheckCircle,
  users: faUsers,
  'pen-nib': faPenNib,
};

@Component({
  selector: 'app-test-detail',
  standalone: true,
  imports: [
    DatePipe,
    FontAwesomeModule,
    TestAssignments,
    TestStats,
    BackTo,
    StatCard,
    TestAiSummaryComponent,
  ],
  templateUrl: './test-detail.html',
  styleUrl: './test-detail.scss',
})
export class TestDetail {
  onPrintResults(): void {
    const modalRef = this.modalService.open(TestResultsPrintModal, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'modal-print-preview',
    });

    modalRef.componentInstance.testName = this.TestData()?.name ?? '';
    modalRef.componentInstance.attempts = this.Attempts();
    modalRef.componentInstance.maxScore = this.TestData()?.maxScore ?? 0;
  }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly testsService = inject(TestsService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly questionsService = inject(QuestionsService);

  // Icone UI statiche
  readonly UsersIcon = faUsers;
  readonly ChartIcon = faChartLine;
  readonly TrashIcon = faTrash;
  readonly EditIcon = faPencilAlt;
  readonly SpinnerIcon = faSpinnerThird;
  readonly PrintIcon = faPrint;

  // State (Signals)
  readonly TestData = signal<any | null>(null);
  readonly BackendStats = signal<any[]>([]);
  readonly Attempts = signal<any[]>([]);
  readonly IsLoading = signal<boolean>(true);
  readonly ActiveSection = signal<number>(1);

  // Computed
  readonly TestId = computed(() => this.route.snapshot.paramMap.get('testId'));

  // Trasforma i dati del backend nel formato richiesto dalle StatCard
  readonly TestStats = computed<StatCardData[]>(() => {
    return this.BackendStats().map((stat) => ({
      Label: stat.title,
      Value: stat.value,
      Icon: IconMap[stat.icon] || this.ChartIcon,
    }));
  });

  // Lista sezioni (rimossa la proprietà 'component' perché usiamo @if nell'HTML)
  readonly Sections = [
    { id: 1, title: 'Assegnazioni', icon: this.UsersIcon },
    { id: 2, title: 'Statistiche', icon: this.ChartIcon },
  ];

  constructor() {
    this.loadTestData();
  }

  private loadTestData(): void {
    const testId = this.TestId();
    if (!testId) {
      this.feedbackService.showFeedback('Test ID non trovato', false);
      this.router.navigate(['/t/tests']);
      return;
    }

    this.IsLoading.set(true);

    this.testsService
      .getTestAttemptsDetails(testId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.TestData.set(response.test);
          this.BackendStats.set(response.stats);
          this.Attempts.set(response.attempts);
          console.log(this.Attempts);
          this.IsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading test details:', error);
          this.feedbackService.showFeedback(
            'Errore nel caricamento dei dati',
            false,
          );
          this.IsLoading.set(false);
          this.router.navigate(['/t/tests']);
        },
      });
  }

  onEditTest(): void {
    const testId = this.TestId();
    if (testId) this.router.navigate(['/t/tests/edit', testId]);
  }

  onDeleteTest(): void {
    const testId = this.TestId();
    if (!testId) return;

    this.testsService
      .deleteTest(testId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedbackService.showFeedback(
            'Test eliminato con successo',
            true,
          );
          this.router.navigate(['/t/tests']);
        },
        error: () =>
          this.feedbackService.showFeedback('Errore eliminazione', false),
      });
  }

  onChangeSection(sectionId: number): void {
    this.ActiveSection.set(sectionId);
  }

  onPrintTest(): void {
    const testId = this.TestId();
    if (!testId) return;

    this.IsLoading.set(true);

    // 1. Get full test details (to get the questions array)
    this.testsService
      .getTestById(testId)
      .pipe(
        switchMap((response) => {
          const fullTest = response.test;
          if (!fullTest.questions || fullTest.questions.length === 0) {
            return of({ test: fullTest, questions: [] });
          }

          // 2. Fetch full details for each question
          const questionRequests = fullTest.questions.map((q: any) =>
            this.questionsService.loadQuestion(q.questionId),
          );

          return forkJoin(questionRequests).pipe(
            switchMap((fullQuestions) =>
              of({ test: fullTest, questions: fullQuestions }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data: any) => {
          this.IsLoading.set(false);
          const modalRef = this.modalService.open(TestPrintModal, {
            size: 'xl',
            centered: true,
            scrollable: true,
            windowClass: 'modal-print-preview',
          });

          modalRef.componentInstance.test = data.test;
          modalRef.componentInstance.questions = data.questions;
        },
        error: (err) => {
          console.error('Error fetching data for print:', err);
          this.IsLoading.set(false);
          this.feedbackService.showFeedback(
            'Errore nel caricamento dei dati per la stampa',
            false,
          );
        },
      });
  }
}
