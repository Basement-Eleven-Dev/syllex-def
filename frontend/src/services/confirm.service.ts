import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../directives/confirm-modal.component';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Provides programmatic confirm dialogs using NgbModal.
 * Replaces native window.confirm() for testability and consistent UX.
 *
 * Reuses the existing ConfirmModalComponent used by ConfirmActionDirective.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NgbModal);
  private readonly transloco = inject(TranslocoService);

  async confirm(
    message: string,
    title?: string,
    confirmText?: string,
    cancelText?: string,
  ): Promise<boolean> {
    const ref = this.modal.open(ConfirmModalComponent, {
      centered: true,
      backdrop: 'static',
    });

    ref.componentInstance.message = message;
    ref.componentInstance.title = title || this.transloco.translate('common.confirm_title');
    ref.componentInstance.confirmText = confirmText || this.transloco.translate('common.confirm_btn');
    ref.componentInstance.cancelText = cancelText || this.transloco.translate('common.cancel');

    try {
      const result = await ref.result;
      return result === 'confirm';
    } catch {
      return false; // Modal dismissed
    }
  }
}
