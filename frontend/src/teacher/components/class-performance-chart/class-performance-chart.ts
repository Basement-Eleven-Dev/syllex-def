import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  Injector,
  viewChild,
} from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, startWith, switchMap } from 'rxjs';
import { AttemptInterface, TestsService } from '../../../services/tests-service';
import { computed, inject, input } from '@angular/core';

// Register Chart.js components
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
);

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

  readonly scores = computed(() => {
    const data = this.attemptsData();
    if (!data) return [];

    // Raggruppa i tentativi per studente e calcola la media
    const studentScores = new Map<string, { total: number; count: number }>();

    data.attempts.forEach((attempt: AttemptInterface) => {
      // Consideriamo solo i test corretti (reviewed) per avere dati attendibili
      if (attempt.status !== 'reviewed') return;

      const current = studentScores.get(attempt.studentId) || {
        total: 0,
        count: 0,
      };
      const percentage = (attempt.score / attempt.maxScore) * 100;

      studentScores.set(attempt.studentId, {
        total: current.total + percentage,
        count: current.count + 1,
      });
    });

    return Array.from(studentScores.values()).map((s) => s.total / s.count);
  });

  readonly IsLoading = computed(() => this.attemptsData() === null);
  readonly IsEmpty = computed(() => {
    const scores = this.scores();
    return this.attemptsData() !== null && scores.length === 0;
  });

  readonly chartRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  chart?: Chart;

  constructor(private injector: Injector) {
    effect(
      () => {
        const canvasRef = this.chartRef();
        const scores = this.scores();

        if (canvasRef && scores.length > 0) {
          this.createScoreDistributionChart(canvasRef, scores);
        } else if (this.chart) {
          this.chart.destroy();
          this.chart = undefined;
        }
      },
      { injector: this.injector },
    );
  }

  private createScoreDistributionChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    scores: number[],
  ): void {
    // Destroy existing chart if present
    if (this.chart) {
      this.chart.destroy();
    }

    const { labels, data } = this.calculateDistribution(scores);

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Performance (%)',
            data: data,
            backgroundColor: '#375ec985',

            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
            title: {
              display: true,
              text: 'Numero di studenti',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Range punteggio',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const count = context.parsed.y;
                return `Studenti: ${count}`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
    console.log(this.chart);
  }

  private calculateDistribution(
    scores: number[],
  ): { labels: string[]; data: number[] } {
    const numBins = 5;
    const binSize = Math.ceil(100 / numBins);
    const bins: number[] = new Array(numBins).fill(0);
    const labels: string[] = [];

    // Create labels for each bin
    for (let i = 0; i < numBins; i++) {
      const start = i * binSize;
      const end = Math.min((i + 1) * binSize, 100);
      labels.push(`${start}-${end}`);
    }

    // Count scores in each bin
    scores.forEach((score) => {
      const binIndex = Math.min(Math.floor(score / binSize), numBins - 1);
      bins[binIndex]++;
    });

    return { labels, data: bins };
  }
}
