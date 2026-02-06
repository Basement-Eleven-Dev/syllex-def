import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from './auth';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  constructor(private http: HttpClient) {}

  getStudents(studentIds: string[]): Observable<{ students: User[] }> {
    return this.http.post<{ students: User[] }>('students', { studentIds });
  }
}
