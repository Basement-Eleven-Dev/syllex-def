import { Component, Input } from '@angular/core';
import { NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';
import { TestInterface } from '../../services/tests-service';

@Component({
  selector: 'app-test-contextual-menu',
  imports: [NgbDropdownItem, ConfirmActionDirective],
  templateUrl: './test-contextual-menu.html',
  styleUrl: './test-contextual-menu.scss',
})
export class TestContextualMenu {
  @Input() test!: TestInterface;
}
