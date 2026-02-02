import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Question } from '../search-questions/search-questions';
import { QuestionCard } from '../question-card/question-card';

@Component({
  selector: 'app-questions-droppable-list',
  imports: [DragDropModule, CommonModule, QuestionCard],
  templateUrl: './questions-droppable-list.html',
  styleUrl: './questions-droppable-list.scss',
})
export class QuestionsDroppableList {
  @Input() testName: string = 'Nuovo Test';
  @Output() questionsChanged = new EventEmitter<Question[]>();
  @Output() saveTest = new EventEmitter<{
    name: string;
    questions: Question[];
  }>();

  @ViewChildren(QuestionCard) questionCards!: QuestionCard[];

  selectedQuestions: Question[] = [];

  onDrop(event: CdkDragDrop<Question[]>): void {
    if (event.previousContainer === event.container) {
      // Riordino all'interno della stessa lista
      moveItemInArray(
        this.selectedQuestions,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // Trasferimento da un'altra lista
      const droppedQuestion = event.item.data as Question;

      // Verifica che la domanda non sia già presente
      const exists = this.selectedQuestions.some(
        (q) => q.id === droppedQuestion.id,
      );
      if (exists) {
        console.warn('Domanda già aggiunta al test');
        return;
      }

      // Crea una copia della domanda e la aggiunge alla lista
      this.selectedQuestions.splice(event.currentIndex, 0, {
        ...droppedQuestion,
      });
    }

    this.emitChanges();
  }

  removeQuestion(questionId: string): void {
    this.selectedQuestions = this.selectedQuestions.filter(
      (q) => q.id !== questionId,
    );
    this.emitChanges();
  }

  clearAll(): void {
    if (confirm('Sei sicuro di voler rimuovere tutte le domande?')) {
      this.selectedQuestions = [];
      this.emitChanges();
    }
  }

  onSave(): void {
    if (this.selectedQuestions.length === 0) {
      alert('Aggiungi almeno una domanda al test');
      return;
    }
    this.saveTest.emit({
      name: this.testName,
      questions: this.selectedQuestions,
    });
  }

  private emitChanges(): void {
    this.questionsChanged.emit([...this.selectedQuestions]);
  }

  getTotalPoints(): number {
    return this.questionCards.reduce((total, card) => {
      return total + (card.points || 0);
    }, 0);
  }

  getQuestionsByType(type: string): number {
    return this.selectedQuestions.filter((q) => q.type === type).length;
  }
}
