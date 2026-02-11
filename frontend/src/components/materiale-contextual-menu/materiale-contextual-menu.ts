import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';
import { NgbDropdownItem, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RenameModal } from '../rename-modal/rename-modal';
import { DatePipe } from '@angular/common';
import { MaterialInterface } from '../../services/materiali-service';
import { FileViewer } from '../file-viewer/file-viewer';
import { AssignClass } from '../assign-class/assign-class';

@Component({
  selector: 'app-materiale-contextual-menu',
  imports: [NgbDropdownItem, ConfirmActionDirective, DatePipe],
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
    modalRef.componentInstance.currentName = this.item.name;

    modalRef.result.then(
      (newName: string) => {
        this.renameItem.emit(newName);
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

  onRequestViewItem() {
    let modalRef = this.modalService.open(FileViewer, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.docUrl = this.item.url;
    modalRef.componentInstance.extension = this.item.extension;
  }

  onRequestDeleteItem() {
    this.deleteItem.emit();
  }
}
