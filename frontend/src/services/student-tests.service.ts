import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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

    // The backend returns { tests, total }, so map to just tests
    const response = this.http.get<{
      tests: StudentTestInterface[];
      total: number;
    }>('students/tests', {
      params,
    });
    return response.pipe(
      // Only return the array of tests
      map(
        (res: { tests: StudentTestInterface[]; total: number }) =>
          res.tests || [],
      ),
    );
  }

  submitTestAttempt(attempt: any) {
    return this.http.post('students/test/execution', attempt);
  }
}
