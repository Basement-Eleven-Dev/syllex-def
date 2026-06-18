import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';
import { NgbDropdownItem, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RenameModal } from '../rename-modal/rename-modal';
import { DatePipe } from '@angular/common';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { FileViewer } from '../file-viewer/file-viewer';
import { AssignClass } from '../assign-class/assign-class';
import { PptxPresenter } from '../pptx-presenter/pptx-presenter';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-materiale-contextual-menu',
  imports: [NgbDropdownItem, ConfirmActionDirective, DatePipe, TranslocoDirective, TranslocoPipe],
  templateUrl: './materiale-contextual-menu.html',
  styleUrl: './materiale-contextual-menu.scss',
})
export class MaterialeContextualMenu {
  @Input() item!: MaterialInterface;

  @Output() renameItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<void>();

  private modalService = inject(NgbModal);

  onRequestRenameItem() {
    const modalRef = this.modalService.open(RenameModal, {
      centered: true,
      size: 'md',
    });

    const fullName = this.item.name;
    const ext = this.item.extension;

    // Strip extension from input display if present
    let baseName = fullName;
    if (ext && fullName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
      baseName = fullName.substring(0, fullName.length - ext.length - 1);
    }

    modalRef.componentInstance.currentName = baseName;

    modalRef.result.then(
      (newName: string) => {
        // Re-append extension if original had one and it's not already typed
        let finalName = newName.trim();
        if (ext && !finalName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
          finalName = `${finalName}.${ext}`;
        }
        this.renameItem.emit(finalName);
      },
      () => {
        // Modal dismissed
      },
    );
  }

  onRequestAssignToClass() {
    let modalRef = this.modalService.open(AssignClass, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.resourceType = 'material';
    modalRef.componentInstance.resource = this.item;
  }

  get isPptx(): boolean {
    const ext = this.item.extension?.toLowerCase();
    return ext === 'pptx' || ext === 'ppt';
  }

  onRequestViewItem() {
    let modalRef = this.modalService.open(FileViewer, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.docUrl = this.item.url;
    modalRef.componentInstance.extension = this.item.extension;
  }

  onRequestPresent() {
    const modalRef = this.modalService.open(PptxPresenter, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: true,
      windowClass: 'presenter-modal',
    });
    modalRef.componentInstance.docUrl = this.item.url;
    modalRef.componentInstance.title = this.item.name;
  }

  onRequestDeleteItem() {
    this.deleteItem.emit();
  }
}
