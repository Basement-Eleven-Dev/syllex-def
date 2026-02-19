import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  CdkDragPlaceholder,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  QuestionInterface,
  QuestionsService,
} from '../../../services/questions';
import { QuestionCard } from '../question-card/question-card';
import { forkJoin } from 'rxjs';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';

/** Extends QuestionInterface with the points assigned in test composition. */
export type QuestionWithPoints = QuestionInterface & { points: number };

@Component({
  selector: 'app-questions-droppable-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    CdkDragPlaceholder,
    CommonModule,
    QuestionCard,
    ConfirmActionDirective,
  ],
  templateUrl: './questions-droppable-list.html',
  styleUrl: './questions-droppable-list.scss',
})
export class QuestionsDroppableList implements OnChanges {
  @Input() testName: string = 'Nuovo Test';
  @Input() questionsToLoad?: { questionId: string; points: number }[];
  @Output() questionsChanged = new EventEmitter<QuestionWithPoints[]>();
  @Output() saveTest = new EventEmitter<{
    name: string;
    questions: QuestionWithPoints[];
  }>();

  // ── State ──────────────────────────────────────────────────────────────────
  readonly selectedQuestions = signal<QuestionWithPoints[]>([]);
  readonly isDraggingOver = signal(false);
  readonly isLoadingQuestions = signal(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly totalPoints = computed(() =>
    this.selectedQuestions().reduce((sum, q) => sum + q.points, 0),
  );

  constructor(private questionsService: QuestionsService) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questionsToLoad'] && this.questionsToLoad?.length) {
      this.loadQuestionsFromIds(this.questionsToLoad);
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  onDragEnter(): void {
    this.isDraggingOver.set(true);
  }

  onDragExit(): void {
    this.isDraggingOver.set(false);
  }

  onDrop(event: CdkDragDrop<QuestionWithPoints[]>): void {
    this.isDraggingOver.set(false);

    if (event.previousContainer === event.container) {
      // Reorder within the same list
      const items = [...this.selectedQuestions()];
      moveItemInArray(items, event.previousIndex, event.currentIndex);
      this.selectedQuestions.set(items);
    } else {
      // Cross-list transfer from search panel
      const dropped = event.item.data as QuestionInterface;
      if (this.selectedQuestions().some((q) => q._id === dropped._id)) return;

      const items = [...this.selectedQuestions()];
      items.splice(event.currentIndex, 0, { ...dropped, points: 1 });
      this.selectedQuestions.set(items);
    }

    this.emitChanges();
  }

  // ── List mutations ─────────────────────────────────────────────────────────
  updatePoints(questionId: string, points: number): void {
    this.selectedQuestions.update((list) =>
      list.map((q) => (q._id === questionId ? { ...q, points } : q)),
    );
    this.emitChanges();
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestions.update((list) =>
      list.filter((q) => q._id !== questionId),
    );
    this.emitChanges();
  }

  clearAll(): void {
    this.selectedQuestions.set([]);
    this.emitChanges();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getQuestionsByType(type: string): number {
    return this.selectedQuestions().filter((q) => q.type === type).length;
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private loadQuestionsFromIds(
    questionsData: { questionId: string; points: number }[],
  ): void {
    this.isLoadingQuestions.set(true);

    const pointsMap = new Map(
      questionsData.map((d) => [d.questionId, d.points]),
    );
    const requests = questionsData.map((d) =>
      this.questionsService.loadQuestion(d.questionId),
    );

    forkJoin(requests).subscribe({
      next: (questions) => {
        this.selectedQuestions.set(
          questions.map((q) => ({ ...q, points: pointsMap.get(q._id) ?? 1 })),
        );
        this.isLoadingQuestions.set(false);
        this.emitChanges();
      },
      error: () => {
        this.isLoadingQuestions.set(false);
      },
    });
  }

  private emitChanges(): void {
    this.questionsChanged.emit([...this.selectedQuestions()]);
  }
}
