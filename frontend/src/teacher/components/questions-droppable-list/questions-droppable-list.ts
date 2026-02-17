import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewChildren,
  QueryList,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  QuestionInterface,
  QuestionsService,
} from '../../../services/questions';
import { QuestionCard } from '../question-card/question-card';
import { forkJoin } from 'rxjs';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';

@Component({
  selector: 'app-questions-droppable-list',
  standalone: true,
  imports: [DragDropModule, CommonModule, QuestionCard, ConfirmActionDirective],
  templateUrl: './questions-droppable-list.html',
  styleUrl: './questions-droppable-list.scss',
})
export class QuestionsDroppableList implements OnChanges, AfterViewInit {
  @Input() testName: string = 'Nuovo Test';
  @Input() questionsToLoad?: { questionId: string; points: number }[];
  @Output() questionsChanged = new EventEmitter<QuestionInterface[]>();
  @Output() saveTest = new EventEmitter<{
    name: string;
    questions: QuestionInterface[];
  }>();

  @ViewChildren(QuestionCard) questionCards!: QueryList<QuestionCard>;

  selectedQuestions: QuestionInterface[] = [];
  questionPointsMap: Map<string, number> = new Map();
  isLoadingQuestions = false;

  constructor(private questionsService: QuestionsService) {}

  ngAfterViewInit(): void {
    // Quando i QuestionCard cambiano, imposta i punteggi (dopo il tick)
    this.questionCards.changes.subscribe(() => {
      setTimeout(() => this.setQuestionPoints());
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questionsToLoad'] && this.questionsToLoad) {
      this.loadQuestionsFromIds(this.questionsToLoad);
    }
  }

  loadQuestionsFromIds(
    questionsData: { questionId: string; points: number }[],
  ): void {
    if (!questionsData || questionsData.length === 0) {
      return;
    }

    console.log('Loading questions from IDs:', questionsData);
    this.isLoadingQuestions = true;
    this.questionPointsMap.clear();

    // Crea array di observables per caricare tutte le domande
    const loadObservables = questionsData.map((qData) => {
      this.questionPointsMap.set(qData.questionId, qData.points);
      return this.questionsService.loadQuestion(qData.questionId);
    });

    forkJoin(loadObservables).subscribe({
      next: (questions) => {
        console.log('Questions loaded successfully:', questions);
        // Mantieni l'ordinamento originale
        this.selectedQuestions = questions;
        this.isLoadingQuestions = false;
        this.emitChanges();

        // Imposta i punteggi DOPO il tick
        setTimeout(() => this.setQuestionPoints());
      },
      error: (error) => {
        console.error('Errore durante il caricamento delle domande:', error);
        this.isLoadingQuestions = false;
      },
    });
  }

  setQuestionPoints(): void {
    const cardsArray = this.questionCards?.toArray() || [];
    console.log(
      'Setting points for cards:',
      cardsArray.length,
      'Questions:',
      this.selectedQuestions.length,
    );
    cardsArray.forEach((card, index) => {
      const question = this.selectedQuestions[index];
      if (question) {
        const savedPoints = this.questionPointsMap.get(question._id);
        if (savedPoints !== undefined) {
          console.log(
            `Setting ${savedPoints} points for question ${question._id}`,
          );
          card.points = savedPoints;
        }
      }
    });
  }

  onDrop(event: CdkDragDrop<QuestionInterface[]>): void {
    if (event.previousContainer === event.container) {
      // Riordino all'interno della stessa lista
      moveItemInArray(
        this.selectedQuestions,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      // Trasferimento da un'altra lista
      const droppedQuestion = event.item.data as QuestionInterface;

      // Verifica che la domanda non sia già presente
      const exists = this.selectedQuestions.some(
        (q) => q._id === droppedQuestion._id,
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
      (q) => q._id !== questionId,
    );
    this.emitChanges();
  }

  clearAll(): void {
    this.selectedQuestions = [];
    this.emitChanges();
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
    if (!this.questionCards) return 0;
    return this.questionCards.toArray().reduce((total, card) => {
      return total + (card.points || 0);
    }, 0);
  }

  getQuestionsByType(type: string): number {
    return this.selectedQuestions.filter((q) => q.type === type).length;
  }
}
