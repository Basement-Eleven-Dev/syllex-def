import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Question } from '../questions-filters/questions-filters';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faChevronDown,
  faChevronUp,
  faCircleChevronDown,
  faCircleChevronUp,
  faExpand,
  faPencilAlt,
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'div[app-question-card]',
  imports: [
    DragDropModule,
    CdkDrag,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  TrashIcon = faTrash;
  CheckIcon = faCheck;
  ExpandIcon = faExpand;
  EditIcon = faPencilAlt;
  CollapseIcon = faCircleChevronDown;
  UnCollapseIcon = faCircleChevronUp;

  points?: number;

  collapsed: boolean = true;

  constructor(private modalServ: NgbModal) {}

  @Input() question!: Question;
  @Input() index: number = 0;
  @Input() showIndex: boolean = false;
  @Input() showTestCompositionActions: boolean = false;
  @Input() showBancaActions: boolean = false;
  @Input() showExplanation: boolean = false;
  @Output() removeMe = new EventEmitter<string>();

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
