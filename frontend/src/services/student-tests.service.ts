import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentTestInterface {
  _id: string;
  name: string;
  subjectName: string;
  status: string;
  availableFrom?: string;
  availableTo?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentTestsService {
  constructor(private http: HttpClient) {}

  getAvailableTests(
    searchTerm: string = '',
  ): Observable<StudentTestInterface[]> {
    console.log('Fetching available tests with searchTerm:', searchTerm);
    const params: any = {};
    if (searchTerm) params.searchTerm = searchTerm;
    return this.http.get<StudentTestInterface[]>('tests/student', { params });
  }
}
