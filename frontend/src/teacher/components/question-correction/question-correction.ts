import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestsService } from '../../../services/tests-service';
import { faSpinner, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-question-correction',
  standalone: true,
  imports: [NgClass, FormsModule, FontAwesomeModule, NgbTooltipModule],
  templateUrl: './question-correction.html',
  styleUrl: './question-correction.scss',
})
export class QuestionCorrection {
  @Input() index: number = 1;
  @Input() data!: any;
  @Input() attemptId!: string;
  @Input() isReviewed!: any;
  @Output() scoreChanged = new EventEmitter<void>();
  aiCorrecting = false;
  private readonly testsService = inject(TestsService);
  readonly spinner = faSpinner;
  readonly infoIcon = faInfoCircle;

  getResultLabel(value: string): string {
    const labels: Record<string, string> = {
      correct: 'Corretta',
      wrong: 'Sbagliata',
      dubious: 'Dubbia',
      empty: 'Non risposta',
    };
    return labels[value] || '';
  }

  getAiProbabilityLabel(value: number): string {
    return value > 50 ? 'Probabile IA' : 'Probabilmente non IA';
  }

  get isOpenTypeQuestion(): boolean {
    return this.data.question.type === 'risposta aperta';
  }

  onScoreChange(value: any): void {
    const score = Number(value);
    if (value === null || value === undefined || value === '') {
      this.data.answer.result = 'dubious';
      this.data.answer.isCorrect = false;
    } else {
      const threshold = this.data.answer.maxScore / 2;
      this.data.answer.result = score >= threshold ? 'correct' : 'wrong';
      this.data.answer.isCorrect = score >= threshold;
    }
    this.scoreChanged.emit();
  }

  correctWithAI() {
    this.aiCorrecting = true;
    this.testsService
      .correctAttemptWithAI(this.attemptId, this.data.question._id)
      .subscribe((response) => {
        const threshold = this.data.answer.maxScore / 2;
        this.data.answer.isCorrect = response.score >= threshold;
        this.data.answer.result = response.score >= threshold ? 'correct' : 'wrong';
        this.data.answer.score = response.score;
        this.data.answer.feedback = response.explanation; // spiegazione dettagliata
        this.data.answer.aiProbability = response.aiProbability;
        this.aiCorrecting = false;
        this.scoreChanged.emit();
      });
  }
}
