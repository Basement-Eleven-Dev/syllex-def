import { DatePipe, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartLine,
  faPencilAlt,
  faSpinnerThird,
  faTrash,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { BackTo } from '../../components/back-to/back-to';
import { StatCard, StatCardData } from '../../components/stat-card/stat-card';
import { TestAssignments } from '../../components/test-assignments/test-assignments';
import { TestStats } from '../../components/test-stats/test-stats';
import { FeedbackService } from '../../../services/feedback-service';
import { TestInterface, TestsService } from '../../../services/tests-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface TestSection {
  id: number;
  title: string;
  icon: any;
  component: any;
}

@Component({
  selector: 'app-test-detail',
  imports: [
    DatePipe,
    NgComponentOutlet,
    FontAwesomeModule,
    TestAssignments,
    TestStats,
    BackTo,
    StatCard,
  ],
  templateUrl: './test-detail.html',
  styleUrl: './test-detail.scss',
})
export class TestDetail {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly testsService = inject(TestsService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  // Icons
  readonly UsersIcon = faUsers;
  readonly ChartIcon = faChartLine;
  readonly TrashIcon = faTrash;
  readonly EditIcon = faPencilAlt;
  readonly SpinnerIcon = faSpinnerThird;

  // State
  readonly TestData = signal<TestInterface | null>(null);
  readonly IsLoading = signal<boolean>(true);
  readonly ActiveSection = signal<number>(1);

  // Computed
  readonly TestId = computed(() => this.route.snapshot.paramMap.get('testId'));
  readonly TestStats = computed<StatCardData[]>(() => {
    const test = this.TestData();
    if (!test) return [];

    return [
      {
        Label: 'Consegne',
        Value: 150,
      },
      {
        Label: 'Punteggio medio',
        Value: 200,
      },
      {
        Label: 'Idonei',
        Value: 300,
      },
    ];
  });

  readonly Sections: TestSection[] = [
    {
      id: 1,
      title: 'Assegnazioni',
      icon: this.UsersIcon,
      component: TestAssignments,
    },
    {
      id: 2,
      title: 'Statistiche',
      icon: this.ChartIcon,
      component: TestStats,
    },
  ];

  readonly ActiveSectionComponent = computed(
    () =>
      this.Sections.find((s) => s.id === this.ActiveSection())?.component ||
      null,
  );

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
      .getTestById(testId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.TestData.set(response.test);
          console.log('Loaded test data:', response.test);
          this.IsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading test:', error);
          this.feedbackService.showFeedback(
            'Errore nel caricamento del test',
            false,
          );
          this.IsLoading.set(false);
          this.router.navigate(['/t/tests']);
        },
      });
  }

  onEditTest(): void {
    const testId = this.TestId();
    if (testId) {
      this.router.navigate(['/t/tests/edit', testId]);
    }
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
        error: (error) => {
          console.error('Error deleting test:', error);
          this.feedbackService.showFeedback(
            "Errore durante l'eliminazione del test",
            false,
          );
        },
      });
  }

  onChangeSection(sectionId: number): void {
    this.ActiveSection.set(sectionId);
  }
}
