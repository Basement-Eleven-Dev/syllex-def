import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, User } from '../../../services/auth';
import {
  StudentTestsService,
  StudentTestInterface,
  StudentAttemptInterface,
} from '../../../services/student-tests.service';
import { forkJoin, of, from } from 'rxjs';
import { catchError, mergeMap, toArray, map } from 'rxjs/operators';
import {
  ComunicazioniService,
  ComunicazioneInterface,
} from '../../../services/comunicazioni-service';
import { Materia, MateriaObject } from '../../../services/materia';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChartPie,
  faVial,
  faBell,
  faArrowRight,
  faRobot,
  faPlay,
  faCheckCircle,
  faChartLine,
  faClipboardList,
} from '@fortawesome/pro-solid-svg-icons';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { StudentTestCardCompact } from '../../components/student-test-card-compact/student-test-card-compact';
import { StudentComunicazioneCard } from '../../components/student-comunicazione-card/student-comunicazione-card';
import { StatCardData } from '../../../teacher/components/stat-card/stat-card';
import { SyllexButton } from '../../../teacher/components/UI/syllex-button/syllex-button';
import { AlexMascot } from '../../../app/shared/components/alex-mascot/alex-mascot';

@Component({
  selector: 'app-dashbaord',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    StudentTestCardCompact,
    StudentComunicazioneCard,
    SyllexButton,
    AlexMascot,
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
  private readonly router = inject(Router);

  readonly PieIcon = faChartPie;
  readonly TestIcon = faVial;
  readonly BellIcon = faBell;
  readonly ArrowRight = faArrowRight;
  readonly RobotIcon = faRobot;
  readonly PlayIcon = faPlay;
  readonly CheckCircleIcon = faCheckCircle;
  readonly PerformanceIcon = faChartLine;
  readonly ClipboardIcon = faClipboardList;

  User = signal<User | null>(null);
  Subjects = this.materiaService.allMaterie;

  CompletedTests = signal<StudentTestInterface[]>([]);

  RecentTests = signal<StudentTestInterface[]>([]);
  TotalTestsCount = signal(0);
  isLoadingData = signal(true);
  AttemptStatusMap = signal<
    Map<string, 'in-progress' | 'delivered' | 'reviewed'>
  >(new Map());
  AttemptScoreMap = signal<Map<string, { score: number; maxScore: number }>>(
    new Map(),
  );

  RecentComunicazioni = signal<ComunicazioneInterface[]>([]);
  readonly UnreadCount = computed(
    () => this.RecentComunicazioni().filter((c) => !c.isRead).length,
  );

  // Statistics
  SubjectStats = signal<StatCardData[]>([]);
  TotalTestsCompleted = signal(0);
  TotalTestsPending = signal(0);
  AverageScore = signal(0);
  OfficialAverageScore = signal(0);
  AutoEvalAverageScore = signal(0);

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => this.User.set(user));
    this.loadDashboardData();
  }

  goToAgentWithSubject(subject: MateriaObject): void {
    this.materiaService.setSelectedSubject(subject);
    this.router.navigate(['/s/agente']);
  }

  getAttemptStatus(
    testId: string,
  ): 'in-progress' | 'delivered' | 'reviewed' | null {
    return this.AttemptStatusMap().get(testId) ?? null;
  }

  getAttemptScore(testId: string): { score: number; maxScore: number } | null {
    return this.AttemptScoreMap().get(testId) ?? null;
  }

  private loadDashboardData() {
    // 1. Load recent tests
    this.testsService
      .getAvailableTests('', '', 1, 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const allTests = res.tests;

        const teacherTests = allTests.filter(
          (t) => t.source !== 'self-evaluation',
        );
        const selfEvalTests = allTests.filter(
          (t) => t.source === 'self-evaluation',
        );

        // Sort teacher tests by availability and take top 3
        const sortedTeacher = teacherTests.sort((a, b) => {
          const dateA = a.availableFrom
            ? new Date(a.availableFrom).getTime()
            : 0;
          const dateB = b.availableFrom
            ? new Date(b.availableFrom).getTime()
            : 0;
          return dateB - dateA; // Newest first
        });
        this.TotalTestsCount.set(teacherTests.length);
        this.RecentTests.set(sortedTeacher.slice(0, 3));

        this.CompletedTests.set(selfEvalTests.slice(0, 3));

        // Fetch all attempts in parallel but limit concurrency to 5 to prevent AWS API Gateway rate limiting
        if (allTests.length > 0) {
          from(allTests)
            .pipe(
              mergeMap(
                (test, index) =>
                  this.testsService.getAttemptByTestId(test._id).pipe(
                    catchError(() => of(null)),
                    map((attempt) => ({ index, attempt })),
                  ),
                5, // MAX 5 CONCURRENT REQUESTS
              ),
              toArray(),
              map((results) =>
                results.sort((a, b) => a.index - b.index).map((r) => r.attempt),
              ),
              takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((attempts) => {
              const newStatusMap = new Map<
                string,
                'in-progress' | 'delivered' | 'reviewed'
              >();
              const newScoreMap = new Map<
                string,
                { score: number; maxScore: number }
              >();

              allTests.forEach((test, index) => {
                const attempt = attempts[index];
                if (attempt) {
                  newStatusMap.set(test._id, attempt.status);

                  if (
                    attempt.status === 'reviewed' ||
                    (test.source === 'self-evaluation' &&
                      attempt.status === 'delivered')
                  ) {
                    const score =
                      attempt.score != null
                        ? attempt.score
                        : attempt.questions.reduce(
                            (sum, q) => sum + (q.score ?? 0),
                            0,
                          );
                    const maxScore =
                      attempt.maxScore != null
                        ? attempt.maxScore
                        : attempt.questions.reduce(
                            (sum, q) => sum + (q.points ?? 0),
                            0,
                          );

                    newScoreMap.set(test._id, { score, maxScore });
                  }
                }
              });

              this.AttemptStatusMap.set(newStatusMap);
              this.AttemptScoreMap.set(newScoreMap);

              // Generate Subject Statistics
              this.computeSubjectStats(allTests, attempts);
              this.isLoadingData.set(false);
            });
        } else {
          this.computeSubjectStats([], []);
          this.isLoadingData.set(false);
        }
      });

    // 2. Load recent communications
    this.comunicazioniService
      .getPagedComunicazioni('', '', '', 1, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.RecentComunicazioni.set(res.communications || []);
      });
  }

  private computeSubjectStats(
    allTests: StudentTestInterface[],
    attempts: (StudentAttemptInterface | null)[],
  ) {
    const subjects = this.materiaService.allMaterie();
    const stats: StatCardData[] = [];

    let completedCount = 0;
    let totalScore = 0;
    let scoresCount = 0;

    let officialTotalScore = 0;
    let officialScoresCount = 0;

    let autoEvalTotalScore = 0;
    let autoEvalScoresCount = 0;

    allTests.forEach((test, index) => {
      const attempt = attempts[index];
      if (
        attempt &&
        (attempt.status === 'delivered' || attempt.status === 'reviewed')
      ) {
        completedCount++;

        // Calculate score percentage
        let hasScore = false;
        let scorePct = 0;

        if (
          attempt.status === 'reviewed' ||
          (test.source === 'self-evaluation' && attempt.status === 'delivered')
        ) {
          const score =
            attempt.score != null
              ? attempt.score
              : (attempt.questions?.reduce(
                  (sum, q) => sum + (q.score ?? 0),
                  0,
                ) ?? 0);
          const maxScore =
            attempt.maxScore != null
              ? attempt.maxScore
              : (attempt.questions?.reduce(
                  (sum, q) => sum + (q.points ?? 0),
                  0,
                ) ?? 0);

          if (maxScore > 0) {
            scorePct = (score / maxScore) * 100;
            hasScore = true;
          }
        }

        if (hasScore) {
          if (test.source === 'self-evaluation') {
            autoEvalTotalScore += scorePct;
            autoEvalScoresCount++;
          } else {
            officialTotalScore += scorePct;
            officialScoresCount++;
          }

          totalScore += scorePct;
          scoresCount++;
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
            existing.Value += 1;
          }
        }
      }
    });

    const pendingCount = allTests.filter((test, index) => {
      if (test.source === 'self-evaluation') return false;
      const attempt = attempts[index];
      return (
        !attempt ||
        (attempt.status !== 'delivered' && attempt.status !== 'reviewed')
      );
    }).length;

    this.TotalTestsCompleted.set(completedCount);
    this.TotalTestsPending.set(pendingCount);
    if (scoresCount > 0) {
      this.AverageScore.set(Math.round(totalScore / scoresCount));
    } else {
      this.AverageScore.set(0);
    }

    if (officialScoresCount > 0) {
      this.OfficialAverageScore.set(
        Math.round(officialTotalScore / officialScoresCount),
      );
    } else {
      this.OfficialAverageScore.set(0);
    }

    if (autoEvalScoresCount > 0) {
      this.AutoEvalAverageScore.set(
        Math.round(autoEvalTotalScore / autoEvalScoresCount),
      );
    } else {
      this.AutoEvalAverageScore.set(0);
    }

    this.SubjectStats.set(
      [...stats].sort((a, b) => b.Value - a.Value).slice(0, 4),
    );
  }
}
