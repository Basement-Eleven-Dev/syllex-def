import { Component, EventEmitter, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-syllex-clear-button',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <button
      type="button"
      class="btn btn-red py-3 px-3"
      (click)="clicked.emit()"
      title="Pulisci filtri"
    >
      <fa-icon [icon]="XIcon"></fa-icon>
    </button>
  `,
})
export class SyllexClearButton {
  @Output() clicked = new EventEmitter<void>();
  protected readonly XIcon = faXmark;
}
