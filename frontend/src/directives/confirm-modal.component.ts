import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ title }}</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="activeModal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-light"
        (click)="activeModal.dismiss()"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="btn btn-danger"
        (click)="activeModal.close('confirm')"
      >
        {{ confirmText }}
      </button>
    </div>
  `,
  styles: [
    `
      .modal-title {
        font-weight: 600;
      }
    `,
  ],
})
export class ConfirmModalComponent {
  title = 'Conferma azione';
  message = 'Sei sicuro di voler procedere?';
  confirmText = 'Conferma';
  cancelText = 'Annulla';

  constructor(public activeModal: NgbActiveModal) {}
}
