import { Component } from '@angular/core';
import { NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';

@Component({
  selector: 'app-test-contextual-menu',
  imports: [NgbDropdownItem, ConfirmActionDirective],
  templateUrl: './test-contextual-menu.html',
  styleUrl: './test-contextual-menu.scss',
})
export class TestContextualMenu {}
