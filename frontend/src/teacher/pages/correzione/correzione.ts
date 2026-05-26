import { DatePipe, TitleCasePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faClock,
  faQuestionCircle,
  faTimes,
  faUser,
  faSpinnerThird,
  faSave,
  faArrowLeft,
  faChartLine,
  faRobot,
} from '@fortawesome/pro-solid-svg-icons';
import { faCircle } from '@fortawesome/pro-regular-svg-icons';
import { QuestionCorrection } from '../../components/question-correction/question-correction';
import { TestsService } from '../../../services/tests-service';
import { FeedbackService } from '../../../services/feedback-service';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import {
  KpiCardData,
  SyllexKpiRow,
} from '../../components/UI/syllex-kpi-row/syllex-kpi-row';

@Component({
  selector: 'app-correzione',
  standalone: true,
  imports: [
    FontAwesomeModule,
    TitleCasePipe,
    DatePipe,
    RouterLink,
    QuestionCorrection,
    SyllexButton,
    SyllexKpiRow,
  ],
  templateUrl: './correzione.html',
  styleUrl: './correzione.scss',
})
export class Correzione implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly testsService = inject(TestsService);
  private readonly feedbackService = inject(FeedbackService);

  // State
  readonly data = signal<any | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly isGeneratingInsight = signal<boolean>(false);
  readonly questionIndex = signal<number>(0);
  readonly attemptId = signal<string | null>(null);

  // Icons
  readonly UserIcon = faUser;
  readonly ClockIcon = faClock;
  readonly QuestionMarkIcon = faQuestionCircle;
  readonly CircleIcon = faCircle;
  readonly CheckIcon = faCheck;
  readonly TimesIcon = faTimes;
  readonly SpinnerIcon = faSpinnerThird;
  readonly SaveIcon = faSave;
  readonly ArrowLeftIcon = faArrowLeft;
  readonly ChartIcon = faChartLine;
  readonly RobotIcon = faRobot;

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) {
      this.attemptId.set(attemptId);
      this.loadData(attemptId);
    }
  }

  private loadData(id: string): void {
    this.isLoading.set(true);
    this.testsService.getAttemptDetail(id).subscribe({
      next: (res) => {
        console.log('Dati caricati per la correzione:', res);
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.feedbackService.showFeedback(
          'Errore nel caricamento del compito',
          false,
        );
        this.isLoading.set(false);
      },
    });
  }

  selectQuestion(index: number) {
    this.questionIndex.set(index);
  }

  onScoreChanged(): void {
    // Force the signal to emit a new reference so Angular re-evaluates
    // allQuestionsAreScored (mutations to nested objects aren't tracked otherwise)
    this.data.update((d) => (d ? { ...d, questions: [...d.questions] } : d));
  }

  submitCorrection() {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    const currentData = this.data();
    if (!attemptId || !currentData) return;

    this.isSaving.set(true);

    // Calcoliamo il punteggio totale finale sommando i singoli punteggi delle domande
    const finalScore = currentData.questions.reduce(
      (acc: number, q: any) => acc + (Number(q.answer.score) || 0),
      0,
    );

    const payload = {
      status: 'reviewed',
      score: finalScore,
      questions: currentData.questions.map((q: any) => ({
        questionId: q.question._id,
        answer: q.answer.answer,
        teacherComment: q.answer.feedback,
        score: Number(q.answer.score),
      })),
    };
    console.log('Payload da inviare per la correzione:', payload);

    this.testsService.saveCorrection(attemptId, payload).subscribe({
      next: () => {
        this.feedbackService.showFeedback(
          'Correzione salvata con successo!',
          true,
        );
        this.router.navigate(['/t/tests']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  get allQuestionsAreScored(): boolean {
    const currentData = this.data();
    if (!currentData) return false;

    return currentData.questions.every((q: any) => {
      const scoreDefined =
        q.answer.score !== undefined && q.answer.score !== null;
      const statusEvaluated = q.answer.result !== 'dubious';
      return scoreDefined && statusEvaluated;
    });
  }

  get backUrl(): string {
    const testId = this.data()?.testId;
    return testId ? `/t/tests/${testId}` : '/t/tests';
  }

  generateAiFeedback(): void {
    const id = this.attemptId();
    if (!id) return;
    this.isGeneratingInsight.set(true);
    this.testsService.getAttemptInsight(id).subscribe({
      next: (res) => {
        this.data.update((d) => (d ? { ...d, aiInsight: res.insight } : d));
        this.feedbackService.showFeedback(
          'Feedback AI generato con successo!',
          true,
        );
        this.isGeneratingInsight.set(false);
      },
      error: () => {
        this.feedbackService.showFeedback(
          'Errore durante la generazione IA',
          false,
        );
        this.isGeneratingInsight.set(false);
      },
    });
  }

  summaryKpis(d: any): KpiCardData[] {
    const mins = Math.floor(d.timeSpent / 60);
    const secs = d.timeSpent % 60;
    const time = `${mins}m ${secs}s`;
    return [
      {
        label: 'Risposte esatte',
        value: d.questionsStats.correct,
        bgColor: '#E6FF80',
        textColor: '#1A5511',
      },
      {
        label: 'Risposte errate',
        value: d.questionsStats.wrong,
        bgColor: '#FFD2D2',
        textColor: '#E51215',
      },
      {
        label: 'Senza risposta',
        value: d.questionsStats.empty,
        bgColor: '#E4E4E4',
        textColor: '#363636',
      },
      {
        label: 'Punteggio',
        value: `${d.score != null ? d.score : '?'} / ${d.maxScore}`,
      },
      { label: 'Tempo impiegato', value: time },
    ];
  }
}
