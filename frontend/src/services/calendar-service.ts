import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Materia } from './materia';

export interface CalendarEvent {
  _id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  subjectId?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);
  private materiaService = inject(Materia);

  getEvents(
    month: number,
    year: number,
  ): Observable<{ events: CalendarEvent[] }> {
    const subjectId = this.materiaService.materiaSelected()?._id;
    return this.http.get<{ events: CalendarEvent[] }>('events', {
      params: {
        subjectId: subjectId || '',
        month: month.toString(),
        year: year.toString(),
      },
    });
  }

  createEvent(data: CalendarEvent): Observable<{ event: CalendarEvent }> {
    data.subjectId = this.materiaService.materiaSelected()!._id;
    return this.http.post<{ event: CalendarEvent }>('events', data);
  }

  deleteEvent(
    eventId: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `events/${eventId}`,
    );
  }

  updateEvent(
    eventId: string,
    data: CalendarEvent,
  ): Observable<{ event: CalendarEvent }> {
    data.subjectId = this.materiaService.materiaSelected()!._id;
    return this.http.put<{ event: CalendarEvent }>(`events/${eventId}`, data);
  }
}
