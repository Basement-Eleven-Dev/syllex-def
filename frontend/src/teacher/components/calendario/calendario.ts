import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faPlus,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Materia } from '../../../services/materia';
import {
  CalendarEvent,
  CalendarService,
} from '../../../services/calendar-service';
import { TestInterface, TestsService } from '../../../services/tests-service';
import { StudentTestsService } from '../../../services/student-tests.service';
import { FeedbackService } from '../../../services/feedback-service';
import { CalendarTestCard } from '../calendar-test-card/calendar-test-card';
import { CalendarEventCard } from '../calendar-event-card/calendar-event-card';
import { AddEventModal } from '../add-event-modal/add-event-modal';

export interface DayBox {
  day: number | null;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-calendario',
  imports: [
    FontAwesomeModule,
    DatePipe,
    UpperCasePipe,
    TitleCasePipe,
    CalendarTestCard,
    CalendarEventCard,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
})
export class Calendario implements OnInit {
  protected readonly ArrowLeftIcon = faChevronLeft;
  protected readonly ArrowRightIcon = faChevronRight;
  protected readonly PlusIcon = faPlus;

  // Kept as plain property for NgbModal componentInstance compatibility
  showCloseButton = false;

  // Services
  protected readonly materiaService = inject(Materia);
  protected readonly ActiveModal = inject(NgbActiveModal, { optional: true });
  private readonly calendarService = inject(CalendarService);
  private readonly testsService = inject(TestsService);
  private readonly studentTestsService = inject(StudentTestsService);
  private readonly modalService = inject(NgbModal);
  private readonly feedbackService = inject(FeedbackService);

  // State signals
  CurrentDate = signal(new Date());
  SelectedDate = signal<Date>(new Date());
  Events = signal<CalendarEvent[]>([]);
  Tests = signal<TestInterface[]>([]);
  showHeadings = input(true);
  /** When true, hides add/edit/delete controls */
  readonly = input(false);
  /** When true, loads student tests instead of teacher tests */
  studentMode = input(false);
  /** Filters events and tests by subjectId client-side */
  subjectFilter = input('');

  // Computed
  CalendarDays = computed(() => this.buildCalendarGrid(this.CurrentDate()));

  private FilteredEvents = computed(() => {
    const filter = this.subjectFilter();
    return filter
      ? this.Events().filter((e) => e.subjectId === filter)
      : this.Events();
  });

  private FilteredTests = computed(() => {
    const filter = this.subjectFilter();
    return filter
      ? this.Tests().filter((t) => t.subjectId === filter)
      : this.Tests();
  });

  SelectedDateEvents = computed(() =>
    this.filterByDate(
      this.FilteredEvents(),
      this.SelectedDate(),
      (e) => new Date(e.date),
    ),
  );

  SelectedDateTests = computed(() =>
    this.filterByDate(this.FilteredTests(), this.SelectedDate(), (t) =>
      t.availableFrom ? new Date(t.availableFrom) : null,
    ),
  );

  HasSelectedDateItems = computed(
    () =>
      this.SelectedDateEvents().length > 0 ||
      this.SelectedDateTests().length > 0,
  );

  constructor() {}

  ngOnInit(): void {
    this.loadMonthData(this.CurrentDate());
  }

  navigateMonth(delta: number): void {
    const current = this.CurrentDate();
    this.CurrentDate.set(
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
    this.loadMonthData(this.CurrentDate());
  }

  selectDate(day: DayBox): void {
    if (!day.isCurrentMonth || day.day === null) return;
    const current = this.CurrentDate();
    this.SelectedDate.set(
      new Date(current.getFullYear(), current.getMonth(), day.day),
    );
  }

  isSelected(day: DayBox): boolean {
    if (!day.isCurrentMonth || day.day === null) return false;
    const selected = this.SelectedDate();
    const current = this.CurrentDate();
    return (
      selected.getDate() === day.day &&
      selected.getMonth() === current.getMonth() &&
      selected.getFullYear() === current.getFullYear()
    );
  }

  getEventCount(day: DayBox): number {
    if (!day.isCurrentMonth || day.day === null) return 0;
    const current = this.CurrentDate();
    const target = new Date(current.getFullYear(), current.getMonth(), day.day);
    return (
      this.countByDate(this.FilteredEvents(), target, (e) => new Date(e.date)) +
      this.countByDate(this.FilteredTests(), target, (t) =>
        t.availableFrom ? new Date(t.availableFrom) : null,
      )
    );
  }

  openAddEventModal(): void {
    const modalRef = this.modalService.open(AddEventModal, { centered: true });
    modalRef.componentInstance.SelectedDate = this.SelectedDate();
    modalRef.componentInstance.SubjectId =
      this.materiaService.materiaSelected()?._id;

    modalRef.result.then(
      (created: CalendarEvent) =>
        this.Events.update((list) => [...list, created]),
      () => {},
    );
  }

  deleteEvent(eventId: string): void {
    this.calendarService.deleteEvent(eventId).subscribe({
      next: () => {
        this.Events.update((list) => list.filter((e) => e._id !== eventId));
        this.feedbackService.showFeedback(
          'Evento eliminato con successo',
          true,
        );
      },
      error: () => {
        this.feedbackService.showFeedback(
          "Errore durante l'eliminazione dell'evento",
          false,
        );
      },
    });
  }

  editEvent(eventId: string): void {
    const eventToEdit = this.Events().find((e) => e._id === eventId);
    if (!eventToEdit) return;

    const modalRef = this.modalService.open(AddEventModal, { centered: true });
    modalRef.componentInstance.SelectedDate = this.SelectedDate();
    modalRef.componentInstance.EventToEdit = eventToEdit;

    modalRef.result.then(
      (updated: CalendarEvent) => {
        this.Events.update((list) =>
          list.map((e) => (e._id === updated._id ? updated : e)),
        );
      },
      () => {},
    );
  }

  // --- Private helpers ---

  private loadMonthData(date: Date): void {
    this.calendarService
      .getEvents(date.getMonth(), date.getFullYear())
      .subscribe((res: { events: CalendarEvent[] }) =>
        this.Events.set(res.events),
      );

    if (this.studentMode()) {
      this.studentTestsService.getAvailableTests().subscribe((tests) => {
        const mapped = tests.map(
          (t) =>
            ({
              _id: t._id,
              name: t.name,
              subjectId: t.subjectId,
              availableFrom: t.availableFrom
                ? new Date(t.availableFrom)
                : undefined,
            }) as TestInterface,
        );
        this.Tests.set(mapped);
      });
    } else {
      this.testsService
        .getPaginatedTests(1, 100, undefined, 'pubblicato')
        .subscribe((res: { tests: TestInterface[]; total: number }) =>
          this.Tests.set(res.tests),
        );
    }
  }

  private buildCalendarGrid(date: Date): DayBox[] {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const days: DayBox[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    return days;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  private filterByDate<T>(
    items: T[],
    target: Date,
    getDate: (item: T) => Date | null,
  ): T[] {
    return items.filter((item) => {
      const d = getDate(item);
      return d ? this.isSameDay(d, target) : false;
    });
  }

  private countByDate<T>(
    items: T[],
    target: Date,
    getDate: (item: T) => Date | null,
  ): number {
    return this.filterByDate(items, target, getDate).length;
  }
}
