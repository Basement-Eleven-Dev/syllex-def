import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-correction',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './question-correction.html',
  styleUrl: './question-correction.scss',
})
export class QuestionCorrection {
  @Input() index: number = 1;
  @Input() data!: any; // Riceve l'oggetto { question: ..., answer: ... }

  getResultLabel(value: string): string {
    const labels: Record<string, string> = {
      correct: 'Corretta',
      wrong: 'Sbagliata',
      dubious: 'Dubbia',
      empty: 'Non risposta',
    };
    return labels[value] || '';
  }
}
