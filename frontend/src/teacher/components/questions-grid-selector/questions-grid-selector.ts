import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { QuestionInterface } from '../../../services/questions';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-questions-grid-selector',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, TranslocoPipe],
  templateUrl: './questions-grid-selector.html',
  styleUrl: './questions-grid-selector.scss',
})
export class QuestionsGridSelector {
  private translocoService = inject(TranslocoService);
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  private _questions: QuestionInterface[] = [];

  @Input()
  set questions(val: QuestionInterface[]) {
    const prevLength = this._questions.length;
    this._questions = val || [];
    if (val && val.length !== prevLength && this.scrollContainer) {
      setTimeout(() => {
        if (this.scrollContainer) {
          this.scrollContainer.nativeElement.scrollTop = 0;
        }
      }, 50);
    }
  }
  get questions(): QuestionInterface[] {
    return this._questions;
  }

  @Input() selectedIds: string[] = [];
  @Input() pointsByQuestion: Record<string, number> = {};
  @Input() preloadedSelected: QuestionInterface[] = [];
  @Input() canLoadMore = false;
  @Input() isLoadingMore = false;
  @Output() toggleSelection = new EventEmitter<QuestionInterface>();
  @Output() pointChanged = new EventEmitter<{
    questionId: string;
    points: number;
  }>();
  @Output() reachBottom = new EventEmitter<void>();

  get sortedQuestions(): QuestionInterface[] {
    // Merge preloaded (from edit mode) with search-loaded questions (deduped)
    const regularIds = new Set(this._questions.map((q) => q._id));
    const merged = [
      ...this.preloadedSelected.filter((q) => !regularIds.has(q._id!)),
      ...this._questions,
    ];
    return merged.sort((a, b) => {
      const aSel = this.isSelected(a._id!);
      const bSel = this.isSelected(b._id!);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return 0;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  onToggle(question: QuestionInterface): void {
    this.toggleSelection.emit(question);
  }

  getPoints(questionId: string): number {
    return this.pointsByQuestion[questionId] ?? 1;
  }

  onPointsInput(questionId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const points = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
    this.pointChanged.emit({ questionId, points });
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
        return this.translocoService.translate('test_preview_modal.type_multiple');
      case 'vero falso':
        return this.translocoService.translate('test_preview_modal.type_truefalse');
      case 'risposta aperta':
        return this.translocoService.translate('test_preview_modal.type_open');
      default:
        return type;
    }
  }
}
