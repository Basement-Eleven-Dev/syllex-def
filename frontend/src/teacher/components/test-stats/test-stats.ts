import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';
import { SlicePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestsService } from '../../../services/tests-service';

Chart.register(...registerables);

@Component({
  selector: 'app-test-stats',
  standalone: true,
  imports: [
    FontAwesomeModule,
    FormsModule,
    SyllexPagination,
    ReactiveFormsModule,
    SlicePipe,
  ],
  templateUrl: './test-stats.html',
  styleUrl: './test-stats.scss',
})
export class TestStats implements OnInit, AfterViewInit, OnChanges {
  @Input() attempts: any[] = [];
  @Input() maxScore: number = 0;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly testsService = inject(TestsService);

  readonly data = signal<any | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly questionIndex = signal<number>(0);

  @ViewChild('scoreChart', { static: false })
  scoreChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topicChart', { static: false })
  topicChartRef!: ElementRef<HTMLCanvasElement>;

  EyeIcon = faEye;
  selectedTopic: string = '';
  availableTopics: string[] = [];

  // Variabili allineate con l'HTML
  processedQuestions: any[] = [];
  scores: number[] = [];
  classSelected: string = '';

  private chart?: Chart;
  private topicChart?: Chart;

  // Paginazione
  page: number = 1;
  pageSize: number = 5;

  get collectionSize(): number {
    return this.processedQuestions.length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attempts'] && this.attempts.length > 0) {
      this.processData();
      this.updateCharts();
    }
  }

  private processData() {
    // 1. Estraiamo i punteggi per il grafico della distribuzione
    this.scores = this.attempts.map((a) => a.score || 0);

    const questionMap = new Map<string, any>();

    this.attempts.forEach((attempt) => {
      attempt.questions?.forEach((q: any) => {
        // Accediamo ai dati nidificati nell'oggetto 'question'
        const questionData = q.question;
        // Usiamo l'ID dell'oggetto question come chiave
        const qId =
          questionData._id?.$oid || questionData._id || questionData.text;

        if (!questionMap.has(qId)) {
          questionMap.set(qId, {
            text: questionData.text,
            topic: questionData.topic || 'Generale',
            correctCount: 0,
            errorCount: 0,
            blankCount: 0,
            totalResponses: 0,
          });
        }

        const stats = questionMap.get(qId);
        stats.totalResponses++;

        if (!q.answer || q.answer.trim() === '') {
          // Caso: Risposta vuota
          stats.blankCount++;
        } else {
          // Caso: Risposta presente. Dobbiamo verificare se è corretta nelle options
          const selectedOption = questionData.options?.find(
            (opt: any) => opt.label === q.answer,
          );

          if (selectedOption?.isCorrect) {
            stats.correctCount++;
          } else {
            stats.errorCount++;
          }
        }
      });
    });

    // Convertiamo la mappa in array per la tabella e estraiamo i topic univoci
    this.processedQuestions = Array.from(questionMap.values());
    this.availableTopics = Array.from(
      new Set(this.processedQuestions.map((q) => q.topic).filter((t) => t)),
    );
  }

  ngAfterViewInit(): void {
    this.updateCharts();
  }

  private updateCharts() {
    setTimeout(() => {
      if (this.scoreChartRef?.nativeElement)
        this.createScoreDistributionChart();
      if (this.topicChartRef?.nativeElement) this.createTopicPerformanceChart();
    }, 300);
  }

  // Metodi richiesti dal template
  onNewPageRequested() {
    /* Qui potresti gestire il cambio pagina se non è puramente client-side */
  }

  onRequestQuestionDetails(stat: any) {
    console.log('Dettagli per:', stat);
  }

  onTopicChange = () => this.createTopicPerformanceChart();

  // --- LOGICA GRAFICI (Invariata ma con controllo distruzione) ---
  private createScoreDistributionChart(): void {
    if (this.chart) this.chart.destroy();
    const { labels, data } = this.calculateDistribution();
    const ctx = this.scoreChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Studenti',
            data: data,
            backgroundColor: '#375ec985',
            borderRadius: 8,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  private calculateDistribution() {
    const numBins = 5;
    const binSize = Math.max(1, Math.ceil(this.maxScore / numBins));
    const bins = new Array(numBins).fill(0);
    const labels = [];
    for (let i = 0; i < numBins; i++) {
      labels.push(
        `${i * binSize}-${Math.min((i + 1) * binSize, this.maxScore)}`,
      );
    }
    this.scores.forEach(
      (s) => bins[Math.min(Math.floor(s / binSize), numBins - 1)]++,
    );
    return { labels, data: bins };
  }

  private createTopicPerformanceChart(): void {
    if (this.topicChart) this.topicChart.destroy();
    const filtered = this.selectedTopic
      ? this.processedQuestions.filter((q) => q.topic === this.selectedTopic)
      : this.processedQuestions;
    const c = filtered.reduce((s, q) => s + q.correctCount, 0);
    const e = filtered.reduce((s, q) => s + q.errorCount, 0);
    const b = filtered.reduce((s, q) => s + q.blankCount, 0);
    const ctx = this.topicChartRef?.nativeElement.getContext('2d');
    if (!ctx) return;
    this.topicChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Corrette', 'Errate', 'Vuote'],
        datasets: [
          {
            data: [c, e, b],
            backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }
  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.loadData(attemptId);
    } else {
      this.router.navigate(['/t/tests']);
    }
  }

  private loadData(id: string): void {
    this.isLoading.set(true);
    this.testsService.getAttemptDetail(id).subscribe({
      next: (response) => {
        this.data.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore:', err);
        this.isLoading.set(false);
      },
    });
  }
}
