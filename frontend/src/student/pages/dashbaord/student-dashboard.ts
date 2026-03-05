import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, User } from '../../../services/auth';
import {
  StudentTestsService,
  StudentTestInterface,
  StudentAttemptInterface,
} from '../../../services/student-tests.service';
import {
  ComunicazioniService,
  ComunicazioneInterface,
} from '../../../services/comunicazioni-service';
import { Materia } from '../../../services/materia';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartPie,
  faVial,
  faBullhorn,
  faArrowRight,
} from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { StudentTestCardCompact } from '../../components/student-test-card-compact/student-test-card-compact';
import { StudentComunicazioneCard } from '../../components/student-comunicazione-card/student-comunicazione-card';
import { StatCardData } from '../../../teacher/components/stat-card/stat-card';

@Component({
  selector: 'app-dashbaord',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    StudentTestCardCompact,
    StudentComunicazioneCard,
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboard implements OnInit {
  private readonly auth = inject(Auth);
  private readonly testsService = inject(StudentTestsService);
  private readonly comunicazioniService = inject(ComunicazioniService);
  private readonly materiaService = inject(Materia);
  private readonly destroyRef = inject(DestroyRef);

  readonly PieIcon = faChartPie;
  readonly TestIcon = faVial;
  readonly MegaphoneIcon = faBullhorn;
  readonly ArrowRight = faArrowRight;

  User = signal<User | null>(null);

  RecentTests = signal<StudentTestInterface[]>([]);
  AttemptStatusMap = signal<
    Map<string, 'in-progress' | 'delivered' | 'reviewed'>
  >(new Map());

  RecentComunicazioni = signal<ComunicazioneInterface[]>([]);

  // Statistics
  SubjectStats = signal<StatCardData[]>([]);
  TotalTestsCompleted = signal(0);
  AverageScore = signal(0);

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => this.User.set(user));
    this.loadDashboardData();
  }

  getAttemptStatus(
    testId: string,
  ): 'in-progress' | 'delivered' | 'reviewed' | null {
    return this.AttemptStatusMap().get(testId) ?? null;
  }

  private loadDashboardData() {
    // 1. Load recent tests
    this.testsService
      .getAvailableTests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tests) => {
        // Sort by availability and take top 3
        const sorted = tests.sort((a, b) => {
          const dateA = a.availableFrom
            ? new Date(a.availableFrom).getTime()
            : 0;
          const dateB = b.availableFrom
            ? new Date(b.availableFrom).getTime()
            : 0;
          return dateB - dateA; // Newest first
        });
        this.RecentTests.set(sorted.slice(0, 3));

        // Fetch attempt status for each
        this.RecentTests().forEach((test) => {
          this.testsService
            .getAttemptByTestId(test._id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((attempt) => {
              if (attempt) {
                this.AttemptStatusMap.update((map) => {
                  const newMap = new Map(map);
                  newMap.set(test._id, attempt.status);
                  return newMap;
                });
              }
            });
        });

        // Generate Subject Statistics by analyzing all available tests vs completed tests
        this.computeSubjectStats(tests);
      });

    // 2. Load recent communications
    this.comunicazioniService
      .getPagedComunicazioni('', '', '', 1, 3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.RecentComunicazioni.set(res.communications || []);
      });
  }

  private computeSubjectStats(allTests: StudentTestInterface[]) {
    const subjects = this.materiaService.allMaterie();
    const stats: StatCardData[] = [];

    let completedCount = 0;
    let totalScore = 0;
    let scoresCount = 0;

    // Fetching attempts to calculate stats
    // Note: In a real scenario, an aggregated backend endpoint would be better.
    // Here we simulate it by checking attempts for tests
    allTests.forEach((test) => {
      this.testsService
        .getAttemptByTestId(test._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((attempt) => {
          if (
            attempt &&
            (attempt.status === 'delivered' || attempt.status === 'reviewed')
          ) {
            completedCount++;

            // Roughly calc a score if reviewed
            if (attempt.status === 'reviewed' && attempt.questions) {
              let attemptScore = 0;
              let attemptMax = 0;
              attempt.questions.forEach((q) => {
                if (q.score !== undefined) attemptScore += q.score;
                if (q.points !== undefined) attemptMax += q.points;
              });
              if (attemptMax > 0) {
                totalScore += (attemptScore / attemptMax) * 100;
                scoresCount++;
              }
            }
          }

          this.TotalTestsCompleted.set(completedCount);
          if (scoresCount > 0) {
            this.AverageScore.set(Math.round(totalScore / scoresCount));
          }

          // Update subject breakdown
          if (test.subjectId) {
            const subj = subjects.find((s) => s._id === test.subjectId);
            if (subj) {
              // Find existing stat
              let existing = stats.find((s) => s.Label === subj.name);
              if (!existing) {
                existing = {
                  Label: subj.name,
                  Value: 0,
                  Link: ['/s', 'tests'],
                  QueryParams: {},
                };
                stats.push(existing);
              }
              if (
                attempt &&
                (attempt.status === 'delivered' ||
                  attempt.status === 'reviewed')
              ) {
                existing.Value += 1;
                this.SubjectStats.set(
                  [...stats].sort((a, b) => b.Value - a.Value).slice(0, 4),
                );
              }
            }
          }
        });
    });
  }
}
