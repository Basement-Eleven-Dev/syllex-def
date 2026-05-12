import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faFileLines, faCircleCheck, faCircle } from '@fortawesome/pro-solid-svg-icons';
import { QuestionInterface } from '../../../services/questions';

@Component({
  selector: 'app-test-preview-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './test-preview-modal.html',
  styleUrl: './test-preview-modal.scss'
})
export class TestPreviewModal {
  activeModal = inject(NgbActiveModal);
  
  @Input() testTitle: string = '';
  @Input() questions: QuestionInterface[] = [];
  
  CloseIcon = faTimes;
  FileIcon = faFileLines;
  CheckIcon = faCircleCheck;
  UncheckIcon = faCircle;

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'scelta multipla': return 'Scelta Multipla';
      case 'vero falso': return 'Vero/Falso';
      case 'risposta aperta': return 'Risposta Aperta';
      default: return type;
    }
  }
}
