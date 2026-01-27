import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Question } from '../questions-filters/questions-filters';
import { QuestionCard } from '../question-card/question-card';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-test-stats',
  imports: [QuestionCard],
  templateUrl: './test-stats.html',
  styleUrl: './test-stats.scss',
})
export class TestStats implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scoreChart', { static: false })
  scoreChartRef!: ElementRef<HTMLCanvasElement>;

  // Mock data - sostituire con chiamata al servizio
  availableQuestions: Question[] = [
    {
      id: '1',
      img: 'https://t4.ftcdn.net/jpg/06/57/37/01/360_F_657370150_pdNeG5pjI976ZasVbKN9VqH1rfoykdYU.jpg',
      text: "Qual è la capitale dell'Italia?",
      type: 'scelta multipla',
      subject: 'Geografia',
      options: [
        { label: 'Milano', isCorrect: false },
        { label: 'Roma', isCorrect: true },
      ],
    },
    {
      id: '2',
      text: 'Il sole sorge a est',
      type: 'vero falso',
      subject: 'Scienze',
    },
    {
      id: '3',
      text: "Descrivi il ciclo dell'acqua",
      type: 'risposta aperta',
      subject: 'Scienze',
    },
  ];

  testMaxScore: number = 95;
  scores: number[] = [
    85, 90, 78, 92, 88, 76, 95, 89, 84, 91, 45, 55, 67, 73, 98, 34, 56, 78, 89,
    92,
  ];

  private chart?: Chart;

  ngOnInit(): void {
    // Chart will be created after view is initialized
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createScoreDistributionChart();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createScoreDistributionChart(): void {
    const { labels, data } = this.calculateDistribution();

    if (!this.scoreChartRef) return;

    const ctx = this.scoreChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Numero di consegne',
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
  }

  private calculateDistribution(): { labels: string[]; data: number[] } {
    const numBins = 5;
    const binSize = Math.ceil(this.testMaxScore / numBins);
    const bins: number[] = new Array(numBins).fill(0);
    const labels: string[] = [];

    // Create labels for each bin
    for (let i = 0; i < numBins; i++) {
      const start = i * binSize;
      const end = Math.min((i + 1) * binSize, this.testMaxScore);
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
