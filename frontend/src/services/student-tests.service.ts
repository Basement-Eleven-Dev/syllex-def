import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { QuestionInterface } from './questions';

export interface StudentTestInterface {
  _id: string;
  name: string;
  subjectName: string;
  status: string;
  availableFrom?: string;
  availableTo?: string;
  timeLimit?: number;
  teacherId?: string;
  subjectId?: string;
  questions?: {
    questionId: string | { $oid: string };
    points: number;
  }[];
}

export interface AttemptQuestionData {
  question: QuestionInterface;
  answer: number | string | null;
}

export interface StudentAttemptInterface {
  _id?: string;
  testId: string;
  subjectId?: string;
  teacherId?: string;
  status: 'in-progress' | 'delivered' | 'reviewed';
  startedAt: string;
  deliveredAt?: string;
  reviewedAt?: string;
  timeSpent: number;
  questions: AttemptQuestionData[];
}

@Injectable({ providedIn: 'root' })
export class StudentTestsService {
  constructor(private http: HttpClient) {}

  getAvailableTests(
    searchTerm: string = '',
  ): Observable<StudentTestInterface[]> {
    const params: any = {};
    if (searchTerm) params.searchTerm = searchTerm;

    return this.http
      .get<{ tests: StudentTestInterface[]; total: number }>('students/tests', {
        params,
      })
      .pipe(map((res) => res.tests || []));
  }

  getAttemptByTestId(
    testId: string,
  ): Observable<StudentAttemptInterface | null> {
    return this.http
      .get<{
        attempt: StudentAttemptInterface | null;
      }>(`students/test/${testId}/attempt`)
      .pipe(map((res) => res.attempt ?? null));
  }

  createAttempt(
    attempt: StudentAttemptInterface,
  ): Observable<StudentAttemptInterface> {
    return this.http
      .post<{
        attempt: StudentAttemptInterface;
      }>('students/test/attempt', attempt)
      .pipe(map((res) => res.attempt));
  }

  updateAttempt(
    attemptId: string,
    data: Partial<StudentAttemptInterface>,
  ): Observable<StudentAttemptInterface> {
    return this.http
      .put<{
        attempt: StudentAttemptInterface;
      }>(`students/test/attempt/${attemptId}`, data)
      .pipe(map((res) => res.attempt));
  }

  submitTestAttempt(attemptId: string): Observable<void> {
    return this.http.post<void>(
      `students/test/attempt/${attemptId}/submit`,
      {},
    );
  }
}
