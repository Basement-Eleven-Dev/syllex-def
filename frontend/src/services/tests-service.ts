import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestData } from '../pages/test/test';

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
  fitScore?: number;
  timeLimit?: number; // in minutes
  draft?: boolean;
  status?: 'bozza' | 'pubblicato' | 'archiviato';
  subjectId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TestsService {
  constructor(private http: HttpClient) {}

  getPaginatedTests(page: number, pageSize: number) {
    return this.http.get<{ tests: TestData[]; total: number }>(
      `tests?page=${page}&pageSize=${pageSize}`,
    );
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
}
