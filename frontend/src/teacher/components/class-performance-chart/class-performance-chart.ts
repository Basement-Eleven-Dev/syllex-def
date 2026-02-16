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
  scores: number[] = [
    85, 90, 78, 92, 88, 76, 95, 89, 84, 91, 45, 55, 67, 73, 98, 34, 56, 78, 89,
    92,
  ]; // medie di performance del singolo studente su tutti i test

  readonly chartRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  chart?: Chart;

  constructor(private injector: Injector) {
    effect(
      () => {
        const canvasRef = this.chartRef();
        if (canvasRef) {
          this.createScoreDistributionChart(canvasRef);
        }
      },
      { injector: this.injector },
    );
  }

  private createScoreDistributionChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
  ): void {
    // Destroy existing chart if present
    if (this.chart) {
      this.chart.destroy();
    }

    const { labels, data } = this.calculateDistribution();

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
              text: 'Numero di consegne',
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
                return `Consegne: ${count}`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
    console.log(this.chart);
  }

  private calculateDistribution(): { labels: string[]; data: number[] } {
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
    this.scores.forEach((score) => {
      const binIndex = Math.min(Math.floor(score / binSize), numBins - 1);
      bins[binIndex]++;
    });

    return { labels, data: bins };
  }
}
