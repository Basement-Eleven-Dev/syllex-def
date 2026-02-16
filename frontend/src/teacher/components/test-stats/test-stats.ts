import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { QuestionInterface } from '../../../services/questions';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';

// Register Chart.js components
Chart.register(...registerables);

interface QuestionStats extends QuestionInterface {
  correctCount: number;
  blankCount: number;
  errorCount: number;
  totalResponses: number;
}

@Component({
  selector: 'app-test-stats',
  imports: [
    FontAwesomeModule,
    FormsModule,
    SyllexPagination,
    ReactiveFormsModule,
  ],
  templateUrl: './test-stats.html',
  styleUrl: './test-stats.scss',
})
export class TestStats implements OnInit, AfterViewInit {
  @ViewChild('scoreChart', { static: false })
  scoreChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('topicChart', { static: false })
  topicChartRef!: ElementRef<HTMLCanvasElement>;

  EyeIcon = faEye;

  selectedTopic: string = '';
  availableTopics: string[] = [];

  collectionSize: number = 5;
  page: number = 1;
  pageSize: number = 2;

  classSelected: string = '';

  availableQuestions: QuestionStats[] = [
    {
      _id: '1',
      imageUrl:
        'https://t4.ftcdn.net/jpg/06/57/37/01/360_F_657370150_pdNeG5pjI976ZasVbKN9VqH1rfoykdYU.jpg',
      text: "Qual è la capitale dell'Italia?",
      type: 'scelta multipla',
      topicId: 'geografia-topic-id',
      subjectId: 'geografia-subject-id',
      teacherId: 'teacher-id',
      options: [
        { label: 'Milano', isCorrect: false },
        { label: 'Roma', isCorrect: true },
      ],
      policy: 'public',
      explanation: "La capitale dell'Italia è Roma.",
      correctCount: 80,
      blankCount: 10,
      errorCount: 10,
      totalResponses: 100,
    },
    {
      _id: '2',
      text: 'Il sole sorge a est',
      type: 'vero falso',
      topicId: 'scienze-topic-id',
      subjectId: 'scienze-subject-id',
      teacherId: 'teacher-id',
      explanation:
        'Il sole sorge effettivamente a est a causa della rotazione della Terra.',
      policy: 'public',
      correctAnswer: true,
      correctCount: 70,
      blankCount: 20,
      errorCount: 10,
      totalResponses: 100,
    },
    {
      _id: '3',
      text: "Descrivi il ciclo dell'acqua",
      type: 'risposta aperta',
      topicId: 'scienze-topic-id',
      subjectId: 'scienze-subject-id',
      teacherId: 'teacher-id',
      explanation:
        "Il ciclo dell'acqua include evaporazione, condensazione, precipitazione e raccolta.",
      policy: 'public',
      correctCount: 50,
      blankCount: 30,
      errorCount: 10,
      totalResponses: 100,
    },
  ];

  testMaxScore: number = 95;
  scores: number[] = [
    85, 90, 78, 92, 88, 76, 95, 89, 84, 91, 45, 55, 67, 73, 98, 34, 56, 78, 89,
    92,
  ];

  private chart?: Chart;
  private topicChart?: Chart;

  ngOnInit(): void {
    this.availableTopics = Array.from(
      new Set(this.availableQuestions.map((q) => q.topicId).filter((t) => t)),
    ) as string[];
  }

  ngAfterViewInit(): void {
    // Increased timeout to ensure DOM is fully rendered
    setTimeout(() => {
      console.log(this.scoreChartRef);
      if (this.scoreChartRef?.nativeElement) {
        this.createScoreDistributionChart();
      }
      console.log(this.topicChartRef);
      if (this.topicChartRef?.nativeElement) {
        this.createTopicPerformanceChart();
      }
    }, 500);
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

  onRequestQuestionDetails(stat: any) {
    // Implement the logic to handle the request for question details
    console.log('Requesting details for question:', stat);
  }

  onTopicChange(): void {
    this.createTopicPerformanceChart();
  }

  onNewPageRequested(): void {}

  private createTopicPerformanceChart(): void {
    if (!this.topicChartRef?.nativeElement) return;

    const ctx = this.topicChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Filter questions by selected topic
    const filteredQuestions = this.selectedTopic
      ? this.availableQuestions.filter((q) => q.topicId === this.selectedTopic)
      : this.availableQuestions;

    // Calculate totals
    const correctTotal = filteredQuestions.reduce(
      (sum, q) => sum + q.correctCount,
      0,
    );
    const errorTotal = filteredQuestions.reduce(
      (sum, q) => sum + q.errorCount,
      0,
    );
    const blankTotal = filteredQuestions.reduce(
      (sum, q) => sum + q.blankCount,
      0,
    );

    // Destroy existing chart if it exists
    if (this.topicChart) {
      this.topicChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['Corrette', 'Errate', 'Vuote'],
        datasets: [
          {
            data: [correctTotal, errorTotal, blankTotal],
            backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = correctTotal + errorTotal + blankTotal;
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    this.topicChart = new Chart(ctx, config);
  }
}
