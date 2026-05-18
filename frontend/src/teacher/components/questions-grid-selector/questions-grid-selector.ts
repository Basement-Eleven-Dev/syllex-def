import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionInterface } from '../../../services/questions';

@Component({
  selector: 'app-questions-grid-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questions-grid-selector.html',
  styleUrl: './questions-grid-selector.scss',
})
export class QuestionsGridSelector {
  @Input() questions: QuestionInterface[] = [];
  @Input() selectedIds: string[] = [];
  @Input() canLoadMore = false;
  @Input() isLoadingMore = false;
  @Output() toggleSelection = new EventEmitter<QuestionInterface>();
  @Output() reachBottom = new EventEmitter<void>();

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  onToggle(question: QuestionInterface): void {
    this.toggleSelection.emit(question);
  }

  onListScroll(event: Event): void {
    if (this.isLoadingMore || !this.canLoadMore) return;
    const el = event.target as HTMLElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 180) {
      this.reachBottom.emit();
    }
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'scelta multipla':
        return 'Scelta Multipla';
      case 'vero falso':
        return 'Vero/Falso';
      case 'risposta aperta':
        return 'Aperta';
      default:
        return type;
    }
  }
}
