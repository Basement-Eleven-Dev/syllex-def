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
            backgroundColor: '#C9F321',
            borderRadius: 16,
            borderSkipped: false,
            barThickness: 64,
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
              label: (context) => `Performance: ${context.parsed.y}%`,
            },
          },
        },
      },
      plugins: [
        {
          id: 'barGradient',
          beforeDatasetsDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta?.data?.length) return;
            meta.data.forEach((bar: any) => {
              const left = bar.x - bar.width / 2;
              const right = bar.x + bar.width / 2;
              const gradient = ctx.createLinearGradient(left, 0, right, 0);
              gradient.addColorStop(0, '#C9F321');
              gradient.addColorStop(1, '#EBFF99');
              bar.options.backgroundColor = gradient;
            });
          },
        },
      ],
    };

    this.chart = new Chart(ctx, config);
  }
}
