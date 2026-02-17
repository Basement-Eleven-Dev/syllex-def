import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  input,
  signal,
} from '@angular/core';
import { QuestionInterface } from '../../../services/questions';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronDown,
  faChevronUp,
  faCircleChevronDown,
  faCircleChevronUp,
  faExpand,
  faPencilAlt,
  faRobot,
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbCollapse, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';
import { Materia } from '../../../services/materia';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'div[app-question-card]',
  standalone: true,
  imports: [
    DragDropModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TitleCasePipe,
  ],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  readonly TrashIcon = faTrash;
  readonly CheckIcon = faCheck;
  readonly ExpandIcon = faExpand;
  readonly EditIcon = faPencilAlt;
  readonly CollapseIcon = faCircleChevronDown;
  readonly UnCollapseIcon = faCircleChevronUp;
  readonly RobotIcon = faRobot;

  points: number = 1;

  readonly questionPreview = computed(() => {
    const maxLength = 80;
    const text = this.question?.text || '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  });

  constructor(
    private modalServ: NgbModal,
    public materiaService: Materia,
  ) {}

  @Input() question!: QuestionInterface;
  @Input() index: number = 0;
  @Input() showIndex: boolean = false;
  @Input() showTestCompositionActions: boolean = false;
  @Input() showBancaActions: boolean = false;
  @Input() showExplanation: boolean = false;
  @Input() showPolicy: boolean = false;
  @Output() removeMe = new EventEmitter<string>();
  @Output() onExpand = new EventEmitter<string>(); // Notifica espansione

  onExpandImage(img: string): void {
    const modalRef = this.modalServ.open(ImageModalContent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.imgSrc = img;
  }
}

@Component({
  selector: 'ng-template[app-image-modal-content]',
  templateUrl: './image-modal-content.html',
})
export class ImageModalContent {
  @Input() imgSrc!: string;
}
