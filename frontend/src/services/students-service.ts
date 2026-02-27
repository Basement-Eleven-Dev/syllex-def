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

  getStudentDetails(studentId: string, classId?: string, page: number = 1, limit: number = 10): Observable<any> {
    const params: any = {};
    if (classId) params.classId = classId;
    params.page = page.toString();
    params.limit = limit.toString();
    return this.http.get(`teacher/students/${studentId}/details`, { params });
  }

  getStudentInsight(studentId: string): Observable<{ insight: string }> {
    return this.http.post<{ insight: string }>(`teacher/students/${studentId}/insight`, {});
  }
}
