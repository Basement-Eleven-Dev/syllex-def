import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CalendarEvent,
  CalendarService,
} from '../../../services/calendar-service';
import { FeedbackService } from '../../../services/feedback-service';
import { BackTo } from '../../components/back-to/back-to';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';

@Component({
  selector: 'app-create-edit-event',
  standalone: true,
  imports: [
    FontAwesomeModule,
    ReactiveFormsModule,
    BackTo,
    ConfirmActionDirective,
  ],
  templateUrl: './create-edit-event.html',
  styleUrl: './create-edit-event.scss',
})
export class CreateEditEvent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly calendarService = inject(CalendarService);
  private readonly feedbackService = inject(FeedbackService);

  readonly SaveIcon = faSave;
  readonly TrashIcon = faTrash;

  private readonly EventId: string | null =
    this.route.snapshot.paramMap.get('eventoId');

  readonly IsLoading = signal(false);
  readonly IsEditMode = computed(() => !!this.EventId);
  readonly PageTitle = computed(() =>
    this.IsEditMode() ? 'Modifica' : 'Nuovo',
  );
  readonly PageDescription = computed(() =>
    this.IsEditMode()
      ? 'Modifica i dettagli del tuo evento.'
      : 'Crea un nuovo evento nel tuo calendario.',
  );

  readonly EventForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    date: new FormControl('', [Validators.required]),
    time: new FormControl(''),
  });

  constructor() {
    if (this.EventId) {
      this.loadEvent(this.EventId);
    } else {
      const datePipe = new DatePipe('en-US');
      const today = datePipe.transform(new Date(), 'yyyy-MM-dd');
      this.EventForm.patchValue({ date: today });
    }
  }

  private loadEvent(id: string): void {
    this.IsLoading.set(true);
    this.calendarService
      .getEventById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (res) => {
          const datePipe = new DatePipe('en-US');
          const eventDate = new Date(res.event.date);
          this.EventForm.patchValue({
            title: res.event.title,
            description: res.event.description || '',
            date: datePipe.transform(eventDate, 'yyyy-MM-dd'),
            time: res.event.time || '',
          });
          this.IsLoading.set(false);
        },
        error: () => {
          this.feedbackService.showFeedback(
            "Errore durante il caricamento dell'evento",
            false,
          );
          this.IsLoading.set(false);
        },
      });
  }

  onDelete(): void {
    if (!this.EventId) return;
    this.IsLoading.set(true);
    this.calendarService
      .deleteEvent(this.EventId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.feedbackService.showFeedback(
            'Evento eliminato con successo',
            true,
          );
          this.router.navigate(['/t/eventi']);
        },
        error: () => {
          this.feedbackService.showFeedback(
            "Errore durante l'eliminazione dell'evento",
            false,
          );
          this.IsLoading.set(false);
        },
      });
  }

  onSave(): void {
    if (this.EventForm.invalid) {
      this.EventForm.markAllAsTouched();
      return;
    }

    this.IsLoading.set(true);
    const eventData: CalendarEvent = {
      title: this.EventForm.value.title!,
      description: this.EventForm.value.description || undefined,
      date: this.EventForm.value.date!,
      time: this.EventForm.value.time || undefined,
    };

    const serviceCall = this.IsEditMode()
      ? this.calendarService.updateEvent(this.EventId!, eventData)
      : this.calendarService.createEvent(eventData);

    serviceCall.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.feedbackService.showFeedback(
          this.IsEditMode()
            ? 'Evento aggiornato con successo'
            : 'Evento creato con successo',
          true,
        );
        this.router.navigate(['/t/eventi']);
      },
      error: () => {
        this.feedbackService.showFeedback(
          this.IsEditMode()
            ? "Errore durante l'aggiornamento dell'evento"
            : "Errore durante la creazione dell'evento",
          false,
        );
        this.IsLoading.set(false);
      },
    });
  }
}
