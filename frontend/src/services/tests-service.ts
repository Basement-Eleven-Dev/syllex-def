import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestData } from '../pages/test/test';

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
}
