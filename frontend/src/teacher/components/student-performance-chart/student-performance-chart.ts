import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-student-performance-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!data() || data().length === 0) {
      <div class="empty-chart">
        <div class="empty-chart-icon">📊</div>
        <p class="text-muted mb-0">Nessun dato disponibile</p>
      </div>
    } @else {
      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
    }
  `,
  styleUrl: './student-performance-chart.scss'
})
export class StudentPerformanceChartComponent implements OnDestroy {
  data = input<any[]>([]);
  compareData = input<any[]>([]); // Optional class averages or other baseline
  type = input<'line' | 'bar' | 'radar' | 'doughnut'>('line');

  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const chartData = this.data();
      const canvas = this.canvasRef();
      if (canvas && chartData && chartData.length > 0) {
        // Small delay to ensure canvas is rendered
        setTimeout(() => this.renderChart(canvas.nativeElement), 50);
      }
    });
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private renderChart(canvas: HTMLCanvasElement) {
    this.chart?.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartData = this.data();
    const chartType = this.type();

    let config: ChartConfiguration;

    if (chartType === 'line') {
      config = this.buildLineConfig(chartData);
    } else if (chartType === 'bar') {
      config = this.buildHorizontalBarConfig(chartData, this.compareData());
    } else {
      config = this.buildDoughnutConfig(chartData);
    }

    this.chart = new Chart(ctx, config);
  }

  private buildDoughnutConfig(data: any[]): ChartConfiguration {
    const primaryColor = '#3931ce';
    const totalPercentage = data.length > 0
      ? data.reduce((acc, d) => acc + (d.percentage ?? d.score ?? 0), 0) / data.length
      : 0;

    return {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name || 'N/D'),
        datasets: [{
          data: data.map(d => d.percentage ?? d.score ?? 0),
          backgroundColor: [
            primaryColor,
            '#6366f1',
            '#818cf8',
            '#a5b4fc',
            '#c7d2fe'
          ],
          borderWidth: 0,
          cutout: '75%',
        } as any]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } }
          },
          tooltip: {
            backgroundColor: '#132149',
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`
            }
          }
        }
      }
    };
  }

  private buildLineConfig(data: any[]): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: data.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        }),
        datasets: [{
          label: 'Punteggio %',
          data: data.map(d => d.score),
          borderColor: '#3931ce',
          backgroundColor: 'rgba(57, 49, 206, 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#3931ce',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#132149',
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `Punteggio: ${ctx.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 25,
              callback: (value) => `${value}%`,
              font: { size: 11 },
              color: '#8a92a6',
            },
            grid: {
              color: 'rgba(0,0,0,0.05)',
            },
            border: { display: false },
          },
          x: {
            ticks: {
              font: { size: 11 },
              color: '#8a92a6',
            },
            grid: { display: false },
            border: { display: false },
          }
        }
      }
    };
  }

  private buildHorizontalBarConfig(data: any[], compareData?: any[]): ChartConfiguration {
    const studentColor = '#3931ce';
    const classColor = '#3931ce33'; // Primary with low opacity

    const datasets: any[] = [{
      label: 'Studente',
      data: data.map(d => d.percentage ?? d.score ?? 0),
      backgroundColor: studentColor,
      borderRadius: 4,
      barThickness: 12,
    }];

    if (compareData && compareData.length > 0) {
      datasets.unshift({
        label: 'Media Classe',
        data: data.map(d => {
          const comp = compareData.find(c => c.name === d.name);
          return comp ? (comp.percentage ?? comp.score ?? 0) : 0;
        }),
        backgroundColor: classColor,
        borderRadius: 4,
        barThickness: 12,
      });
    }

    return {
      type: 'bar',
      data: {
        labels: data.map(d => d.name || 'N/D'),
        datasets: datasets
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: !!(compareData && compareData.length > 0),
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: '#132149',
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 25, callback: (v) => `${v}%`, font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.05)' },
            border: { display: false },
          },
          y: {
            ticks: { font: { size: 11 }, color: '#495057' },
            grid: { display: false },
            border: { display: false },
          }
        }
      }
    };
  }
}
