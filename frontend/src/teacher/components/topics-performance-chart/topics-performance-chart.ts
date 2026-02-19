import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { catchError, of, startWith, switchMap } from 'rxjs';
import {
  TestsService,
  TopicPerformance,
} from '../../../services/tests-service';

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
  selector: 'app-topics-performance-chart',
  imports: [],
  templateUrl: './topics-performance-chart.html',
  styleUrl: './topics-performance-chart.scss',
})
export class TopicsPerformanceChart implements OnDestroy {
  private readonly testsService = inject(TestsService);

  readonly classId = input.required<string>();
  readonly ChartRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');

  private chart?: Chart;

  // null = request in-flight, object = request settled
  readonly TopicsData = toSignal(
    toObservable(this.classId).pipe(
      switchMap((id) =>
        this.testsService.getClassTopicsPerformance(id).pipe(
          startWith(null),
          catchError(() => of({ topicsPerformance: [] })),
        ),
      ),
    ),
  );

  readonly IsLoading = computed(() => this.TopicsData() == null);
  readonly IsEmpty = computed(() => {
    const data = this.TopicsData();
    return data != null && data.topicsPerformance.length === 0;
  });

  constructor() {
    effect(() => {
      const canvasRef = this.ChartRef();
      const response = this.TopicsData();

      console.log('TopicsData changed:', response);
      if (
        canvasRef &&
        response != null &&
        response.topicsPerformance.length > 0
      ) {
        this.drawChart(canvasRef, response.topicsPerformance);
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private drawChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: TopicPerformance[],
  ): void {
    this.chart?.destroy();

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    console.log('Drawing chart with data:', data);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.map((t) => t.topicName),
        datasets: [
          {
            label: 'Performance media',
            data: data.map((t) => t.percentage),
            backgroundColor: '#13214985',
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
            max: 100,
            ticks: { stepSize: 10 },
            title: {
              display: true,
              text: 'Performance (%)',
              font: { size: 14, weight: 'bold' },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Argomenti',
              font: { size: 14, weight: 'bold' },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Performance: ${context.parsed.y}%`,
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
}
