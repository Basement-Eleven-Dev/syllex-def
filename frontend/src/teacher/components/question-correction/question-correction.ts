import { Component, inject, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestsService } from '../../../services/tests-service';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-question-correction',
  standalone: true,
  imports: [NgClass, FormsModule, FontAwesomeModule],
  templateUrl: './question-correction.html',
  styleUrl: './question-correction.scss',
})
export class QuestionCorrection {
  @Input() index: number = 1;
  @Input() data!: any;
  @Input() attemptId!: string;
  @Input() isReviewed!: any;
  aiCorrecting = false;
  private readonly testsService = inject(TestsService);
  readonly spinner = faSpinner;

  getResultLabel(value: string): string {
    const labels: Record<string, string> = {
      correct: 'Corretta',
      wrong: 'Sbagliata',
      dubious: 'Dubbia',
      empty: 'Non risposta',
    };
    return labels[value] || '';
  }

  get isOpenTypeQuestion(): boolean {
    return this.data.question.type === 'risposta aperta';
  }

  correctWithAI() {
    this.aiCorrecting = true;
    this.testsService
      .correctAttemptWithAI(this.attemptId, this.data.question._id)
      .subscribe((response) => {
        this.data.answer.isCorrect = response.score >= 0.5;
        this.data.answer.result = response.score >= 0.5 ? 'correct' : 'wrong';
        this.data.answer.score = response.score;
        this.data.answer.feedback = response.explanation; // spiegazione dettagliata
        this.aiCorrecting = false;
      });
  }
}
