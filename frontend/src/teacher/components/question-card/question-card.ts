import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { QuestionInterface } from '../../../services/questions';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronDown,
  faPencilAlt,
  faTrash,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Materia } from '../../../services/materia';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';
import { SyllexBadge } from '../UI/syllex-badge/syllex-badge';
import { SyllexButton } from '../UI/syllex-button/syllex-button';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    ConfirmActionDirective,
    SyllexBadge,
    SyllexButton,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  protected readonly TrashIcon = faTrash;
  protected readonly CheckIcon = faCheck;
  protected readonly WrongIcon = faXmark;
  protected readonly EditIcon = faPencilAlt;
  protected readonly ChevronIcon = faChevronDown;

  Collapsed = signal(true);

  private readonly modalServ = inject(NgbModal);
  protected readonly materiaService = inject(Materia);
  private readonly translocoService = inject(TranslocoService);

  get policyLabel() {
    return this.question.policy === 'private'
      ? this.translocoService.translate('banca.card.policy_private')
      : this.translocoService.translate('banca.card.policy_public');
  }

  get typeLabel() {
    switch (this.question.type) {
      case 'scelta multipla':
        return this.translocoService.translate('banca.tabs.scelta_multipla').toUpperCase();
      case 'vero falso':
        return this.translocoService.translate('banca.tabs.vero_falso').toUpperCase();
      case 'risposta aperta':
        return this.translocoService.translate('banca.tabs.aperta').toUpperCase();
      default:
        return this.question.type;
    }
  }

  get translatedStatus() {
    if (!this.questionStatus) return '';
    switch (this.questionStatus) {
      case 'correct': return this.translocoService.translate('banca.card.status_correct');
      case 'wrong':
      case 'incorrect': return this.translocoService.translate('banca.card.status_wrong');
      case 'pending': return this.translocoService.translate('banca.card.status_pending');
      default: return this.translocoService.translate('banca.card.status_partial');
    }
  }

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
  @Input() questionStatus:
    | 'correct'
    | 'wrong'
    | 'incorrect'
    | 'semi-correct'
    | 'partial'
    | 'pending'
    | null = null;
  @Input() teacherFeedback: string | null = null;
  @Input() feedbackLabel: string = 'Commento del docente';
  @Input() showCorrectness: boolean = true;
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

  getSourceName(): string | null {
    if (!this.question?.sourceMaterialId) return null;
    if (typeof this.question.sourceMaterialId === 'object') {
      return (this.question.sourceMaterialId as any).name || null;
    }
    return null;
  }
}

@Component({
  selector: 'ng-template[app-image-modal-content]',
  templateUrl: './image-modal-content.html',
})
export class ImageModalContent {
  @Input() imgSrc!: string;
}
