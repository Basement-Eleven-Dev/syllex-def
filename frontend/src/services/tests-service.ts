import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Materia } from './materia';

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
  hasPendingCorrections?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TestsService {
  constructor(
    private http: HttpClient,
    private materiaService: Materia,
  ) {}

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

  countAssignmentsToGrade() {
    let subjectId = this.materiaService.materiaSelected()?._id;
    return this.http.get<{ count: number }>(
      `tests/assignments-to-grade/${subjectId}/count`,
    );
  }
  countPublishedTests() {
    let subjectId = this.materiaService.materiaSelected()?._id;
    return this.http.get<{ count: number }>(
      `tests/${subjectId}/published/count`,
    );
  }

  updateClassIds(testId: string, classIds: string[]) {
    return this.http.put<{ success: boolean; test: TestInterface }>(
      `tests/${testId}/classes`,
      { classIds },
    );
  }
}
