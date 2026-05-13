import {
  Component,
  effect,
  ElementRef,
  Injector,
  viewChild,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, startWith, switchMap } from 'rxjs';
import {
  AttemptInterface,
  TestsService,
} from '../../../services/tests-service';
import { computed, inject, input } from '@angular/core';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
);

// Sep=8 Oct=9 Nov=10 Dec=11 Jan=0 Feb=1 Mar=2 Apr=3 May=4 Jun=5
const SCHOOL_MONTH_LABELS = [
  'Set',
  'Ott',
  'Nov',
  'Dic',
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
];
const SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

@Component({
  selector: 'app-class-performance-chart',
  imports: [],
  templateUrl: './class-performance-chart.html',
  styleUrl: './class-performance-chart.scss',
})
export class ClassPerformanceChart {
  private readonly testsService = inject(TestsService);
  readonly classId = input.required<string>();

  readonly attemptsData = toSignal(
    toObservable(this.classId).pipe(
      switchMap((id) =>
        this.testsService.getClassAttempts(id).pipe(
          startWith(null),
          catchError(() => of({ attempts: [] })),
        ),
      ),
    ),
  );

  readonly monthlyData = computed<(number | null)[]>(() => {
    const data = this.attemptsData();
    if (!data) return [];

    const buckets = SCHOOL_MONTHS.map(() => ({ total: 0, count: 0 }));

    data.attempts.forEach((attempt: AttemptInterface) => {
      if (!attempt.maxScore || attempt.maxScore === 0) return;
      const dateVal = attempt.deliveredAt ?? attempt.reviewedAt;
      if (!dateVal) return;
      const month = new Date(dateVal).getMonth();
      const idx = SCHOOL_MONTHS.indexOf(month);
      if (idx === -1) return;
      const pct = (attempt.score / attempt.maxScore) * 100;
      buckets[idx].total += pct;
      buckets[idx].count += 1;
    });

    return buckets.map((b) =>
      b.count > 0 ? Math.round(b.total / b.count) : null,
    );
  });

  readonly IsLoading = computed(() => this.attemptsData() === null);
  readonly IsEmpty = computed(() => {
    const data = this.attemptsData();
    return data !== null && this.monthlyData().every((v) => v === null);
  });

  readonly chartRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  chart?: Chart;

  constructor(private injector: Injector) {
    effect(
      () => {
        const canvasRef = this.chartRef();
        const monthly = this.monthlyData();

        if (canvasRef && monthly.length > 0) {
          this.createAreaChart(canvasRef, monthly);
        } else if (this.chart) {
          this.chart.destroy();
          this.chart = undefined;
        }
      },
      { injector: this.injector },
    );
  }

  private createAreaChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: (number | null)[],
  ): void {
    this.chart?.destroy();

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: SCHOOL_MONTH_LABELS,
        datasets: [
          {
            label: 'Performance (%)',
            data,
            borderColor: '#3931CE',
            borderWidth: 2.5,
            backgroundColor: '#3931CE',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3931CE',
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
              callback: (v) => `${v}%`,
            },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
          x: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) =>
                context.parsed.y != null
                  ? `Performance: ${context.parsed.y}%`
                  : 'Nessun dato',
            },
          },
        },
      },
      plugins: [
        {
          id: 'areaGradient',
          afterLayout(chart) {
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return;
            const grad = c.createLinearGradient(
              chartArea.left,
              0,
              chartArea.right,
              0,
            );
            grad.addColorStop(0, '#3931CE');
            grad.addColorStop(1, '#52A0FF');
            chart.data.datasets[0].backgroundColor = grad;
          },
        },
      ],
    };

    this.chart = new Chart(ctx, config);
  }
}
