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
      class="rounded-circle p-1 btn d-flex justify-content-center align-items-center  bg-primary text-white"
      style="width: 37.6px; height: 37.6px;"
      (click)="clicked.emit()"
      title="Pulisci filtri"
    >
      <fa-icon [icon]="XIcon" class="p-1"></fa-icon>
    </button>
  `,
})
export class SyllexClearButton {
  @Output() clicked = new EventEmitter<void>();
  protected readonly XIcon = faXmark;
}
