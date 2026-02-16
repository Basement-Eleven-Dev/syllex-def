import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbDropdownItem, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';
import { TestInterface } from '../../../services/tests-service';
import { RouterLink, RouterModule } from '@angular/router';
import { AssignClass } from '../assign-class/assign-class';

@Component({
  selector: 'app-test-contextual-menu',
  imports: [NgbDropdownItem, ConfirmActionDirective, RouterLink, RouterModule],
  templateUrl: './test-contextual-menu.html',
  styleUrl: './test-contextual-menu.scss',
})
export class TestContextualMenu {
  @Input() test!: TestInterface;
  @Output() delete = new EventEmitter<string>();

  constructor(private modalService: NgbModal) {}

  onRequestAssignToClass() {
    let modalRef = this.modalService.open(AssignClass, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.resourceType = 'test';
    modalRef.componentInstance.resource = this.test;
  }
}
