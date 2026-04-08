import { apiClient } from "./apiClient";
import {
  StudentTestInterface,
  StudentAttemptInterface,
  SelfEvaluationPayload,
} from "../types";

interface TestsListResponse {
  tests: StudentTestInterface[];
  total: number;
}

interface AttemptResponse {
  attempt: StudentAttemptInterface | null;
}

interface SelfEvaluationResponse {
  testId: string;
  attemptId: string;
}

export const testsService = {
  getAvailableTests: (
    page = 1,
    pageSize = 10,
    searchTerm?: string,
    subjectId?: string,
  ) =>
    apiClient
      .get<TestsListResponse>("tests", {
        params: {
          page,
          pageSize,
          ...(searchTerm && { searchTerm }),
          ...(subjectId && { subjectId }),
        },
      })
      .then((r) => r.data),

  getAttemptByTestId: (testId: string) =>
    apiClient
      .get<AttemptResponse>(`test/${testId}/attempt`)
      .then((r) => r.data.attempt ?? null),

  createAttempt: (attempt: StudentAttemptInterface, password?: string) =>
    apiClient
      .post<{
        attempt: StudentAttemptInterface;
      }>(`test/${attempt.testId}/attempt`, { ...attempt, ...(password && { password }) })
      .then((r) => r.data.attempt),

  updateAttempt: (
    testId: string,
    attemptId: string,
    data: Partial<StudentAttemptInterface>,
  ) =>
    apiClient
      .put<{
        attempt: StudentAttemptInterface;
      }>(`test/${testId}/attempt/${attemptId}`, data)
      .then((r) => r.data.attempt),

  submitAttempt: (testId: string, attemptId: string) =>
    apiClient
      .post<void>(`test/${testId}/attempt/${attemptId}/submit`, {})
      .then(() => undefined),

  createSelfEvaluation: (payload: SelfEvaluationPayload) =>
    apiClient
      .post<SelfEvaluationResponse>("self-evaluation", payload)
      .then((r) => r.data),

  getStudentAttempts: (page = 1, pageSize = 10) =>
    apiClient
      .get<{ attempts: StudentAttemptInterface[]; total: number }>(
        "student/attempts",
        {
          params: { page, pageSize },
        },
      )
      .then((r) => r.data),
};
