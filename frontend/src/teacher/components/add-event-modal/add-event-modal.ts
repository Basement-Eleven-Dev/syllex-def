import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarService,
} from '../../../services/calendar-service';
import { FeedbackService } from '../../../services/feedback-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-add-event-modal',
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ EventToEdit ? 'Modifica evento' : 'Aggiungi evento' }}
      </h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="ActiveModal.dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <form [formGroup]="Form">
        <div class="mb-3">
          <label for="title" class="form-label">Titolo *</label>
          <input
            type="text"
            class="form-control custom-input"
            id="title"
            formControlName="title"
            placeholder="Es. Riunione genitori"
          />
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">Descrizione</label>
          <textarea
            class="form-control custom-input"
            id="description"
            formControlName="description"
            rows="3"
            placeholder="Descrizione dell'evento (opzionale)"
          ></textarea>
        </div>
        <div class="row">
          <div class="col-6">
            <label for="date" class="form-label">Data *</label>
            <input
              type="date"
              class="form-control custom-input"
              id="date"
              formControlName="date"
            />
          </div>
          <div class="col-6">
            <label for="time" class="form-label">Ora</label>
            <input
              type="time"
              class="form-control custom-input"
              id="time"
              formControlName="time"
            />
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-outline-primary"
        (click)="ActiveModal.dismiss()"
      >
        Annulla
      </button>
      <button
        type="button"
        class="btn btn-primary"
        [disabled]="Form.invalid || Saving()"
        (click)="onSave()"
      >
        {{
          Saving()
            ? 'Salvataggio...'
            : EventToEdit
              ? 'Aggiorna evento'
              : 'Salva evento'
        }}
      </button>
    </div>
  `,
})
export class AddEventModal implements OnInit {
  ActiveModal = inject(NgbActiveModal);
  private readonly fb = inject(FormBuilder);
  private readonly calendarService = inject(CalendarService);
  private readonly feedbackService = inject(FeedbackService);

  /** Set via componentInstance from the calendar */
  SelectedDate!: Date;
  /** Set via componentInstance when editing an existing event */
  EventToEdit?: CalendarEvent;

  Form!: FormGroup;
  Saving = signal(false);

  ngOnInit() {
    const datePipe = new DatePipe('en-US');

    // Se stiamo modificando un evento, pre-popola il form con i suoi dati
    if (this.EventToEdit) {
      // Formatta la data dell'evento nel formato yyyy-MM-dd per l'input date HTML
      const eventDate = new Date(this.EventToEdit.date);
      const formattedDate = datePipe.transform(eventDate, 'yyyy-MM-dd');

      this.Form = this.fb.group({
        title: [this.EventToEdit.title, Validators.required],
        description: [this.EventToEdit.description || ''],
        date: [formattedDate, Validators.required],
        time: [this.EventToEdit.time || ''],
      });
    } else {
      const formattedDate = datePipe.transform(this.SelectedDate, 'yyyy-MM-dd');
      this.Form = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        date: [formattedDate, Validators.required],
        time: [''],
      });
    }
  }

  onSave(): void {
    if (this.Form.invalid) return;
    this.Saving.set(true);

    const data: CalendarEvent = {
      title: this.Form.value.title,
      description: this.Form.value.description,
      date: this.Form.value.date,
      time: this.Form.value.time || undefined,
    };

    if (this.EventToEdit && this.EventToEdit._id) {
      // Modifica evento esistente
      this.calendarService.updateEvent(this.EventToEdit._id, data).subscribe({
        next: (res) => {
          this.feedbackService.showFeedback(
            'Evento aggiornato con successo',
            true,
          );
          this.ActiveModal.close(res.event);
        },
        error: () => {
          this.feedbackService.showFeedback(
            "Errore durante l'aggiornamento dell'evento",
            false,
          );
          this.Saving.set(false);
        },
      });
    } else {
      // Crea nuovo evento
      this.calendarService.createEvent(data).subscribe({
        next: (res) => {
          this.feedbackService.showFeedback('Evento creato con successo', true);
          this.ActiveModal.close(res.event);
        },
        error: () => {
          this.feedbackService.showFeedback(
            "Errore durante la creazione dell'evento",
            false,
          );
          this.Saving.set(false);
        },
      });
    }
  }
}
