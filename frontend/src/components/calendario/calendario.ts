import {
  AsyncPipe,
  DatePipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { BehaviorSubject, map } from 'rxjs';

interface DayBox {
  day: number | null;
  isCurrentMonth: boolean;
}

interface CalendarEvent {
  testTitle: string;
  date: Date;
  classrooms: string[];
}

@Component({
  selector: 'app-calendario',
  imports: [
    FontAwesomeModule,
    DatePipe,
    AsyncPipe,
    UpperCasePipe,
    TitleCasePipe,
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
})
export class Calendario {
  CalendarIcon = faCalendar;
  ArrowRightIcon = faChevronRight;
  ArrowLeftIcon = faChevronLeft;

  calendarEvents: CalendarEvent[] = [
    {
      testTitle: 'Test di Matematica',
      date: new Date(2026, 0, 12),
      classrooms: ['Classe 1A', 'Classe 2B'],
    },
  ];

  currentDate$ = new BehaviorSubject<Date>(new Date());
  firstDayOfMonth$ = this.currentDate$.pipe(
    map((date) => new Date(date.getFullYear(), date.getMonth(), 1)),
  );
  lastDayOfMonth$ = this.currentDate$.pipe(
    map((date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  );
  calendarDays$ = this.currentDate$.pipe(
    map((date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      let firstDayOfWeek = firstDay.getDay() - 1;
      if (firstDayOfWeek === -1) firstDayOfWeek = 6;

      const daysInMonth = lastDay.getDate();
      const days: DayBox[] = [];

      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ day: null, isCurrentMonth: false });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        days.push({ day, isCurrentMonth: true });
      }

      const remainingCells = (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7;
      for (let i = 0; i < remainingCells; i++) {
        days.push({ day: null, isCurrentMonth: false });
      }

      return days;
    }),
  );

  onPreviousMonth() {
    this.currentDate$.next(
      new Date(
        this.currentDate$.getValue().getFullYear(),
        this.currentDate$.getValue().getMonth() - 1,
        1,
      ),
    );
  }

  onNextMonth() {
    this.currentDate$.next(
      new Date(
        this.currentDate$.getValue().getFullYear(),
        this.currentDate$.getValue().getMonth() + 1,
        1,
      ),
    );
  }

  selectedDate: Date | null = null;

  onSelectDate(day: DayBox) {
    if (!day.isCurrentMonth || day.day === null) return;

    this.selectedDate = new Date(
      this.currentDate$.getValue().getFullYear(),
      this.currentDate$.getValue().getMonth(),
      day.day,
    );
  }

  isSelected(day: DayBox): boolean {
    if (!day.isCurrentMonth || day.day === null || !this.selectedDate) {
      return false;
    }

    const currentMonth = this.currentDate$.getValue().getMonth();
    const currentYear = this.currentDate$.getValue().getFullYear();

    return (
      this.selectedDate.getDate() === day.day &&
      this.selectedDate.getMonth() === currentMonth &&
      this.selectedDate.getFullYear() === currentYear
    );
  }

  getEventCountForDay(day: DayBox): number {
    if (!day.isCurrentMonth || day.day === null) return 0;

    const currentMonth = this.currentDate$.getValue().getMonth();
    const currentYear = this.currentDate$.getValue().getFullYear();

    return this.calendarEvents.filter((event) => {
      return (
        event.date.getDate() === day.day &&
        event.date.getMonth() === currentMonth &&
        event.date.getFullYear() === currentYear
      );
    }).length;
  }
}
