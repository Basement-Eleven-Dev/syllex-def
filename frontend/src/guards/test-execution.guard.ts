import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../directives/confirm-modal.component';

export interface CanDeactivateComponent {
  canDeactivate(): boolean;
}

export const testExecutionGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component,
) => {
  if (component.canDeactivate()) {
    return true;
  }

  const modalService = inject(NgbModal);
  const modalRef = modalService.open(ConfirmModalComponent, {
    centered: true,
    backdrop: 'static',
  });

  modalRef.componentInstance.title = 'Abbandonare il test?';
  modalRef.componentInstance.message =
    'Non hai ancora completato il test. Sicuro di voler abbandonare la pagina?';
  modalRef.componentInstance.confirmText = 'Abbandona';
  modalRef.componentInstance.cancelText = 'Resta';

  return modalRef.result.then(
    () => true,
    () => false,
  );
};
