import { Directive, HostListener, input, output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from './confirm-modal.component';

@Directive({
  selector: '[confirmAction]',
  standalone: true,
})
export class ConfirmActionDirective {
  confirmMessage = input<string>(
    'Sei sicuro di voler procedere? Questa azione non può essere annullata.',
  );
  confirmTitle = input<string>('Confermi?');
  confirmButtonText = input<string>('Conferma');
  cancelButtonText = input<string>('Annulla');

  confirmed = output<void>();

  constructor(private modalService: NgbModal) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      backdrop: 'static',
    });

    modalRef.componentInstance.message = this.confirmMessage();
    modalRef.componentInstance.title = this.confirmTitle();
    modalRef.componentInstance.confirmText = this.confirmButtonText();
    modalRef.componentInstance.cancelText = this.cancelButtonText();

    modalRef.result.then(
      (result) => {
        if (result === 'confirm') {
          this.confirmed.emit();
        }
      },
      () => {
        // Modal dismissed
      },
    );
  }
}
