import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faCircle } from '@fortawesome/pro-solid-svg-icons';
import { QuestionInterface } from '../../../services/questions';

@Component({
  selector: 'app-questions-grid-selector',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './questions-grid-selector.html',
  styleUrl: './questions-grid-selector.scss',
})
export class QuestionsGridSelector {
  @Input() questions: QuestionInterface[] = [];
  @Input() selectedIds: string[] = [];
  @Output() toggleSelection = new EventEmitter<QuestionInterface>();

  CheckIcon = faCheckCircle;
  UncheckIcon = faCircle;

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  onToggle(question: QuestionInterface): void {
    this.toggleSelection.emit(question);
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'scelta multipla': return 'Scelta Multipla';
      case 'vero falso': return 'Vero/Falso';
      case 'risposta aperta': return 'Aperta';
      default: return type;
    }
  }
}
