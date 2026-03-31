import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { QuestionInterface } from './questions';

export interface SelfEvaluationPayload {
  name?: string;
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  excludedTypes: string[];
  timeLimit: number | null;
}

export interface SelfEvaluationResponse {
  testId: string;
  attemptId: string;
}

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
  isPasswordProtected?: boolean;
  randomizeQuestions?: boolean;
  oneShotAnswers?: boolean;
  questions?: {
    questionId: string | { $oid: string };
    points: number;
  }[];
}

export interface AttemptQuestionData {
  question: QuestionInterface;
  answer: number | string | null;
  points?: number;
  score?: number;
  teacherComment?: string;
  status?: 'correct' | 'wrong' | 'semi-correct';
}

export interface StudentAttemptInterface {
  _id?: string;
  testId: string;
  subjectId?: string;
  teacherId?: string;
  source?: 'self-evaluation' | 'teacher';
  status: 'in-progress' | 'delivered' | 'reviewed';
  startedAt: string;
  deliveredAt?: string;
  reviewedAt?: string;
  timeSpent: number;
  score?: number | null;
  maxScore?: number | null;
  questions: AttemptQuestionData[];
}

@Injectable({ providedIn: 'root' })
export class StudentTestsService {
  constructor(private http: HttpClient) { }

  getAvailableTests(
    searchTerm: string = '',
    subjectId: string = '',
    page: number = 1,
    pageSize: number = 5,
  ): Observable<{ tests: StudentTestInterface[]; total: number }> {
    const params: any = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    if (searchTerm) params.searchTerm = searchTerm;
    if (subjectId) params.subjectId = subjectId;

    return this.http.get<{ tests: StudentTestInterface[]; total: number }>(
      'tests',
      {
        params,
      },
    );
  }

  getAttemptByTestId(
    testId: string,
  ): Observable<StudentAttemptInterface | null> {
    return this.http
      .get<{
        attempt: StudentAttemptInterface | null;
      }>(`test/${testId}/attempt`)
      .pipe(map((res) => res.attempt ?? null));
  }

  createAttempt(
    attempt: StudentAttemptInterface,
    password?: string,
  ): Observable<StudentAttemptInterface> {
    const body: any = { ...attempt };
    if (password) body.password = password;
    return this.http
      .post<{
        attempt: StudentAttemptInterface;
      }>('test/' + attempt.testId + '/attempt', body)
      .pipe(map((res) => res.attempt));
  }

  updateAttempt(
    attemptId: string,
    data: Partial<StudentAttemptInterface>,
  ): Observable<StudentAttemptInterface> {
    return this.http
      .put<{
        attempt: StudentAttemptInterface;
      }>(`test/${data.testId}/attempt/${attemptId}`, data)
      .pipe(map((res) => res.attempt));
  }

  submitTestAttempt(attemptId: string, testId: string): Observable<void> {
    return this.http.post<void>(
      `test/${testId}/attempt/${attemptId}/submit`,
      {},
    );
  }

  createSelfEvaluation(
    payload: SelfEvaluationPayload,
  ): Observable<SelfEvaluationResponse> {
    return this.http
      .post<{ success: boolean } & SelfEvaluationResponse>('attempts', payload)
      .pipe(map(({ testId, attemptId }) => ({ testId, attemptId })));
  }

  countQuestions(
    subjectId: string,
    topicIds: string[],
    excludedTypes: string[],
  ): Observable<{ count: number }> {
    const params: any = {
      subjectId,
      topicIds: topicIds.join(','),
      excludedTypes: excludedTypes.join(','),
    };
    return this.http.get<{ count: number }>('attempts/questions-count', {
      params,
    });
  }
}
