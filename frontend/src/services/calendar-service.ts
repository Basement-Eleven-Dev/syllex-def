import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CalendarEvent {
  _id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private http = inject(HttpClient);

  getEvents(
    month: number,
    year: number,
  ): Observable<{ events: CalendarEvent[] }> {
    return this.http.get<{ events: CalendarEvent[] }>('events', {
      params: {
        month: month.toString(),
        year: year.toString(),
      },
    });
  }

  getEventById(eventId: string): Observable<{ event: CalendarEvent }> {
    return this.http.get<{ event: CalendarEvent }>(`events/${eventId}`);
  }

  createEvent(data: CalendarEvent): Observable<{ event: CalendarEvent }> {
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
    return this.http.put<{ event: CalendarEvent }>(`events/${eventId}`, data);
  }
}
