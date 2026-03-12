import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../directives/confirm-modal.component';

/**
 * Provides programmatic confirm dialogs using NgbModal.
 * Replaces native window.confirm() for testability and consistent UX.
 *
 * Reuses the existing ConfirmModalComponent used by ConfirmActionDirective.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NgbModal);

  async confirm(
    message: string,
    title = 'Confermi?',
    confirmText = 'Conferma',
  ): Promise<boolean> {
    const ref = this.modal.open(ConfirmModalComponent, {
      centered: true,
      backdrop: 'static',
    });

    ref.componentInstance.message = message;
    ref.componentInstance.title = title;
    ref.componentInstance.confirmText = confirmText;

    try {
      const result = await ref.result;
      return result === 'confirm';
    } catch {
      return false; // Modal dismissed
    }
  }
}
