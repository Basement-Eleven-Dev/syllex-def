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
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

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
  selector: 'app-topics-performance-chart',
  imports: [],
  templateUrl: './topics-performance-chart.html',
  styleUrl: './topics-performance-chart.scss',
})
export class TopicsPerformanceChart {
  // Mock data: topic names with average performance scores (1-100)
  topicsPerformance = [
    { topic: 'Algebra', score: 85 },
    { topic: 'Geometria', score: 78 },
    { topic: 'Trigonometria', score: 92 },
    { topic: 'Funzioni', score: 68 },
    { topic: 'Derivate', score: 88 },
    { topic: 'Integrali', score: 75 },
    { topic: 'Limiti', score: 82 },
  ];

  readonly chartRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  chart?: Chart;

  constructor(private injector: Injector) {
    effect(
      () => {
        const canvasRef = this.chartRef();
        if (canvasRef) {
          this.createTopicsPerformanceChart(canvasRef);
        }
      },
      { injector: this.injector },
    );
  }

  private createTopicsPerformanceChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
  ): void {
    // Destroy existing chart if present
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.topicsPerformance.map((t) => t.topic);
    const data = this.topicsPerformance.map((t) => t.score);

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
            label: 'Performance media',
            data: data,
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
            ticks: {
              stepSize: 10,
            },
            title: {
              display: true,
              text: 'Performance (%)',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Argomenti',
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
                const score = context.parsed.y;
                return `Performance: ${score}%`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
}
