import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faChartLine,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import {
  KpiCardData,
  SyllexKpiRow,
} from '../../components/UI/syllex-kpi-row/syllex-kpi-row';
import { StatisticheClasse } from '../../components/statistiche-classe/statistiche-classe';
import { StudentiClasseTable } from '../../components/studenti-classe-table/studenti-classe-table';
import {
  ClassInterface,
  ClassiService,
} from '../../../services/classi-service';
import {
  ClassStatisticsService,
  StudentPerformanceData,
} from '../../../services/class-statistics.service';
import { TestsService } from '../../../services/tests-service';

import { BackTo } from '../../components/back-to/back-to';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-class-detail',
  imports: [
    RouterModule,
    StudentiClasseTable,
    FontAwesomeModule,
    StatisticheClasse,
    SyllexKpiRow,
    BackTo,
    SyllexPageHeader,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './classe-dettaglio.html',
  styleUrl: './classe-dettaglio.scss',
})
export class ClasseDettaglio {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly classService = inject(ClassiService);
  private readonly testsService = inject(TestsService);
  private readonly statisticsService = inject(ClassStatisticsService);
  private readonly translocoService = inject(TranslocoService);

  // Icons
  readonly ArrowLeftIcon = faArrowLeft;
  readonly ChartIcon = faChartLine;
  readonly UsersIcon = faUsers;

  // State
  readonly ClassData = signal<ClassInterface | null>(null);
  readonly StudentsData = signal<StudentPerformanceData[]>([]);
  readonly AssignedTestsCount = signal<number>(0);
  readonly SubmittedTestsCount = signal<number>(0);
  readonly AveragePerformance = signal<number>(0);
  readonly IsLoading = signal<boolean>(true);
  readonly ErrorMessage = signal<string | null>(null);

  // Computed stats
  readonly Stats = computed<KpiCardData[]>(() => {
    const classData = this.ClassData();
    if (!classData) return [];

    return [
      {
        label: this.translocoService.translate('class_detail.kpi_students'),
        value: this.StudentsData().length,
      },
      {
        label: this.translocoService.translate('class_detail.kpi_perf'),
        requirePercentage: true,
        value: this.AveragePerformance(),
      },
      {
        label: this.translocoService.translate('class_detail.kpi_assigned'),
        value: this.AssignedTestsCount(),
        buttonLink: '/t/tests/new',
        buttonQueryParams: { assign: classData._id },
        buttonLabel: this.translocoService.translate('class_detail.btn_new_test'),
      },
      {
        label: this.translocoService.translate('class_detail.kpi_submitted'),
        value: this.SubmittedTestsCount(),
        buttonLink: ['/t/tests'],
        buttonLabel: this.translocoService.translate('class_detail.btn_see_all'),
      },
    ];
  });

  readonly ClassNotFound = computed(
    () => !this.IsLoading() && !this.ClassData(),
  );

  constructor() {
    // React to route parameter changes
    this.route.params
      .pipe(
        takeUntilDestroyed(),
        map((params) => params['classeId']),
        filter((classId): classId is string => !!classId),
        switchMap((classId) => this.loadClassData(classId)),
      )
      .subscribe();
  }

  private loadClassData(classId: string) {
    this.IsLoading.set(true);
    this.ErrorMessage.set(null);

    // Find class in cache
    const classData = this.classService.classi().find((c) => c._id === classId);

    if (!classData) {
      console.warn('Class not found with ID:', classId);
      this.router.navigate(['/t/classi']);
      return of(null);
    }

    this.ClassData.set(classData);

    // Load all class-related data in parallel
    return forkJoin({
      students: this.classService.getClassStudents(classId).pipe(
        catchError((error) => {
          console.error('Failed to load students:', error);
          return of({ students: [] });
        }),
      ),
      attempts: this.testsService.getClassAttempts(classId).pipe(
        catchError((error) => {
          console.error('Failed to load attempts:', error);
          return of({ attempts: [] });
        }),
      ),
      assignedTests: this.classService.getClassAssignedTests(classId).pipe(
        catchError((error) => {
          console.error('Failed to load assigned tests:', error);
          return of({ tests: [] });
        }),
      ),
    }).pipe(
      map((data) => {
        // Update statistics
        this.AssignedTestsCount.set(data.assignedTests.tests.length);
        this.SubmittedTestsCount.set(data.attempts.attempts.length);
        this.AveragePerformance.set(
          this.statisticsService.computeAveragePerformance(
            data.attempts.attempts,
          ),
        );

        // Enrich students with performance data
        const enrichedStudents =
          this.statisticsService.enrichStudentsWithPerformance(
            data.students.students,
            data.attempts.attempts,
          );
        this.StudentsData.set(enrichedStudents);

        this.IsLoading.set(false);
        return data;
      }),
      catchError((error) => {
        console.error('Unexpected error loading class data:', error);
        this.ErrorMessage.set(this.translocoService.translate('class_detail.err_load'));
        this.IsLoading.set(false);
        return of(null);
      }),
    );
  }
}
