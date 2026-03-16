import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface TestInterface {
  _id?: string;
  name: string;
  availableFrom?: Date;
  availableTo?: Date;
  classIds?: string[];
  password?: string;
  questions?: {
    questionId: string;
    points: number;
  }[];
  maxScore?: number;
  fitScore?: number;
  timeLimit?: number; // in minutes
  draft?: boolean;
  status?: 'bozza' | 'pubblicato' | 'archiviato';
  subjectId?: string;
  hasPendingCorrections?: boolean;
  uncorrectedCount?: number;
  randomizeQuestions?: boolean;
  oneShotAnswers?: boolean;
}

interface TestDetailsResponse {
  test: {
    _id: string;
    name: string;
    availableFrom: any;
    status: string;
    maxScore: number;
    fitScore: number;
  };
  stats: {
    title: string;
    value: string | number;
    icon: string;
  }[];
  attempts: any[]; // Qui puoi usare la tua AttemptInterface
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  percentage: number;
}

export interface AttemptInterface {
  _id: string;
  studentId: string;
  teacherId: string;
  testId: string;
  subjectId: string;
  status: 'not-reviewed' | 'reviewed';
  deliverdAt: Date;
  reviewedAt?: Date;
  score: number;
  maxScore: number;
  fitTestScore?: boolean; // idoneo / non idoneo
}

@Injectable({
  providedIn: 'root',
})
export class TestsService {
  constructor(private http: HttpClient) { }

  getPaginatedTests(
    page: number,
    pageSize: number,
    searchTerm?: string,
    status?: 'bozza' | 'pubblicato' | 'archiviato',
  ) {
    let url = `tests?page=${page}&pageSize=${pageSize}`;

    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    if (status) {
      url += `&status=${status}`;
    }

    return this.http.get<{ tests: TestInterface[]; total: number }>(url);
  }

  createTest(testData: TestInterface) {
    return this.http.post<{ test: TestInterface }>('tests', testData);
  }

  editTest(testId: string, testData: TestInterface) {
    return this.http.put<{ test: TestInterface }>(`tests/${testId}`, testData);
  }

  getTestById(testId: string) {
    return this.http.get<{ test: TestInterface }>(`tests/${testId}`);
  }

  deleteTest(testId: string) {
    return this.http.delete<{ success: boolean; message: string }>(
      `tests/${testId}`,
    );
  }

  duplicateTest(testId: string) {
    return this.http.post<{ test: TestInterface }>(
      `tests/${testId}/duplicate`,
      {},
    );
  }

  publishTest(testId: string) {
    return this.http.put<{ test: TestInterface }>(`tests/${testId}`, {
      status: 'pubblicato',
    });
  }

  countAssignmentsToGrade() {
    return this.http.get<{ count: number }>('tests/assignments-to-grade/count');
  }
  countPublishedTests() {
    return this.http.get<{ count: number }>('tests/published/count');
  }

  updateClassIds(testId: string, classIds: string[]) {
    return this.http.put<{ success: boolean; test: TestInterface }>(
      `tests/${testId}/classes`,
      { classIds },
    );
  }

  getClassAttempts(classId: string) {
    return this.http.get<{ attempts: AttemptInterface[] }>(
      `classes/${classId}/attempts`,
    );
  }

  getClassAttemptsOnTest(testId: string, classId: string) {
    return this.http.get<{ attempts: AttemptInterface[] }>(
      `attempts/${testId}/${classId}`,
    );
  }

  getTestAttemptsDetails(testId: string) {
    // Nota: l'URL deve corrispondere alla apiRoute + il parametro id
    return this.http.get<TestDetailsResponse>(
      `test/${testId}/attempts-details`,
    );
  }

  getAttemptDetail(attemptId: string) {
    const response = this.http.get<any>(`attempts/${attemptId}/details`);
    console.log('getAttemptDetail response:', response);
    return response;
  }

  saveCorrection(attemptId: string, payload: any) {
    return this.http.post<{ success: boolean; message: string }>(
      `attempts/${attemptId}/correction`,
      payload,
    );
  }

  correctAttemptWithAI(attemptId: string, questionId: string) {
    return this.http.post<{ score: number; explanation: string, aiProbability: string }>(
      `attempts/${attemptId}/questions/${questionId}/ai-correction`,
      {},
    );
  }

  getClassTopicsPerformance(classId: string) {
    return this.http.get<{ topicsPerformance: TopicPerformance[] }>(
      `classes/${classId}/topics-performance`,
    );
  }

  getTestInsight(testId: string) {
    return this.http.post<{ insight: string }>(`tests/${testId}/insight`, {});
  }

  getAttemptInsight(attemptId: string) {
    return this.http.get<{ insight: string }>(
      `attempts/${attemptId}/insight`
    );
  }
}
