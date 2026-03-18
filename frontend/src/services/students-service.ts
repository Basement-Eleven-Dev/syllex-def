import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  constructor(private http: HttpClient) { }


  getStudentDetails(
    studentId: string,
    classId?: string,
    subjectId?: string,
    page: number = 1,
    limit: number = 10,
  ): Observable<any> {
    const params: any = {};
    if (classId) params.classId = classId;
    if (subjectId) params.subjectId = subjectId;
    params.page = page.toString();
    params.limit = limit.toString();
    return this.http.get(`students/${studentId}`, { params });
  }

  getStudentInsight(
    studentId: string,
    subjectId?: string,
  ): Observable<{ insight: string }> {
    return this.http.get<{ insight: string }>(
      `students/${studentId}/insight`
    );
  }
}
