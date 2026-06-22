import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTimes,
  faFileLines,
  faCircleCheck,
  faCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { QuestionInterface } from '../../../services/questions';
import { SyllexButton } from '../UI/syllex-button/syllex-button';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-test-preview-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, SyllexButton, TranslocoDirective, TranslocoPipe],
  templateUrl: './test-preview-modal.html',
  styleUrl: './test-preview-modal.scss',
})
export class TestPreviewModal {
  activeModal = inject(NgbActiveModal);
  private translocoService = inject(TranslocoService);

  @Input() testTitle: string = '';
  @Input() questions: QuestionInterface[] = [];

  CloseIcon = faTimes;
  FileIcon = faFileLines;
  CheckIcon = faCircleCheck;
  UncheckIcon = faCircle;

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
