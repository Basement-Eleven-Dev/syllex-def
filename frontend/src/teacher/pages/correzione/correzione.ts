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
} from '@fortawesome/pro-solid-svg-icons';
import { faCircle } from '@fortawesome/pro-regular-svg-icons';
import { QuestionCorrection } from '../../components/question-correction/question-correction';
import { TestsService } from '../../../services/tests-service';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-correzione',
  standalone: true,
  imports: [
    FontAwesomeModule,
    TitleCasePipe,
    DatePipe,
    QuestionCorrection,
    DecimalPipe,
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
  readonly questionIndex = signal<number>(0);

  // Icons
  readonly UserIcon = faUser;
  readonly ClockIcon = faClock;
  readonly QuestionMarkIcon = faQuestionCircle;
  readonly CircleIcon = faCircle;
  readonly CheckIcon = faCheck;
  readonly TimesIcon = faTimes;
  readonly SpinnerIcon = faSpinnerThird;
  readonly SaveIcon = faSave;

  ngOnInit(): void {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');
    if (attemptId) this.loadData(attemptId);
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
}
