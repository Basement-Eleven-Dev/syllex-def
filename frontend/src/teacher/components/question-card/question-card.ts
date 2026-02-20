import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { QuestionInterface } from '../../../services/questions';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faPencilAlt,
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Materia } from '../../../services/materia';
import { TitleCasePipe } from '@angular/common';

/** Controls what the card renders and which actions are visible. */
export type QuestionCardMode =
  | 'preview' // topic + type + text + options (no correct highlights, no actions) – default
  | 'banca' // preview + correct highlights + policy pill + edit/delete + explanation
  | 'ai-review' // banca-like: correct highlights + explanation, but no action buttons
  | 'test-composition' // preview + points input + remove button + drag handle
  | 'student'; // interactive radio/textarea + status feedback after submission

@Component({
  selector: 'div[app-question-card]',
  standalone: true,
  imports: [
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    RouterModule,
    TitleCasePipe,
  ],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  protected readonly TrashIcon = faTrash;
  protected readonly CheckIcon = faCheck;
  protected readonly EditIcon = faPencilAlt;

  private readonly modalServ = inject(NgbModal);
  protected readonly materiaService = inject(Materia);

  // ── Core ─────────────────────────────────────────────────────────────────
  @Input({ required: true }) question!: QuestionInterface;
  @Input() mode: QuestionCardMode = 'preview';
  @Input() index: number = 0;
  @Input() showIndex: boolean = false;
  @Input() locked: boolean = false;
  @Input() dimmed: boolean = false;

  // ── Test-composition ──────────────────────────────────────────────────────
  /** Local copy used for ngModel binding; synced via the setter. */
  protected LocalPoints: number = 1;
  @Input() set points(v: number) {
    this.LocalPoints = v;
  }
  @Output() pointsChange = new EventEmitter<number>();
  @Output() removeMe = new EventEmitter<string>();

  // ── Student mode ──────────────────────────────────────────────────────────
  @Input() selectedAnswer: number | string | null = null;
  @Input() score: number | null = null;
  @Input() questionStatus: 'correct' | 'wrong' | 'semi-correct' | null = null;
  @Input() teacherFeedback: string | null = null;
  @Output() answerChange = new EventEmitter<number | string>();

  onExpandImage(img: string): void {
    const modalRef = this.modalServ.open(ImageModalContent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.imgSrc = img;
  }

  onSelectOption(label: string): void {
    if (this.locked) return;
    this.answerChange.emit(label);
  }

  onOpenAnswerChange(value: string): void {
    if (this.locked) return;
    this.answerChange.emit(value);
  }
}

@Component({
  selector: 'ng-template[app-image-modal-content]',
  templateUrl: './image-modal-content.html',
})
export class ImageModalContent {
  @Input() imgSrc!: string;
}
