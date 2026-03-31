import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { QuestionInterface } from '../../../services/questions';
import { QuestionCard } from '../question-card/question-card';

@Component({
  selector: 'app-question-preview-modal',
  standalone: true,
  imports: [QuestionCard],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Dettaglio Domanda</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Chiudi"
        (click)="activeModal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <div app-question-card [question]="question" mode="banca"></div>
    </div>
  `,
})
export class QuestionPreviewModal {
  readonly activeModal = inject(NgbActiveModal);
  @Input() question!: QuestionInterface;
}
