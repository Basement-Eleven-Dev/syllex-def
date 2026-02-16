import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faMarker, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { CalendarEvent } from '../../../services/calendar-service';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';

@Component({
  selector: 'app-calendar-event-card',
  imports: [FontAwesomeModule, ConfirmActionDirective],
  template: `
    <div class="p-3 event-card rounded-syllex mb-3 d-flex flex-column gap-2">
      <div class="d-flex flex-row align-items-center justify-content-between">
        <h6 class="mb-0">{{ Event().title }}</h6>
        <div class="d-flex align-items-center gap-2">
          @if (Event().time) {
            <small class="text-muted">
              <fa-icon [icon]="ClockIcon"></fa-icon> {{ Event().time }}
            </small>
          }
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            (click)="Edited.emit(Event()._id!)"
            title="Modifica evento"
          >
            <fa-icon [icon]="EditIcon"></fa-icon>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            confirmAction
            [confirmMessage]="'Sei sicuro di voler eliminare questo evento?'"
            confirmTitle="Conferma eliminazione"
            (confirmed)="Deleted.emit(Event()._id!)"
            title="Elimina evento"
          >
            <fa-icon [icon]="TrashIcon"></fa-icon>
          </button>
        </div>
      </div>
      @if (Event().description) {
        <small class="fw-light ellipsis-1-lines">{{
          Event().description
        }}</small>
      }
    </div>
  `,
  styles: `
    .event-card {
      border-left: 5px solid var(--bs-primary);
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
    }
  `,
})
export class CalendarEventCard {
  protected readonly ClockIcon = faClock;
  protected readonly TrashIcon = faTrash;
  protected readonly EditIcon = faMarker;

  Event = input.required<CalendarEvent>();
  Deleted = output<string>();
  Edited = output<string>();
}
