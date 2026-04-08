import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testsService } from "../services/testsService";
import { questionsService } from "../services/questionsService";
import { QuestionInterface, StudentAttemptInterface } from "../types";

export const TEST_KEYS = {
  all: ["tests"] as const,
  list: (page: number, search?: string, subjectId?: string) =>
    [...TEST_KEYS.all, "list", page, search, subjectId] as const,
  attempt: (testId: string) => [...TEST_KEYS.all, "attempt", testId] as const,
  execution: (testId: string) => ["execution", testId] as const,
  studentAttempts: (page: number) => ["student-attempts", page] as const,
};

export function useAvailableTests(
  page = 1,
  search?: string,
  subjectId?: string,
) {
  return useQuery({
    queryKey: TEST_KEYS.list(page, search, subjectId),
    queryFn: () => testsService.getAvailableTests(page, 10, search, subjectId),
  });
}

export function useAttemptByTestId(testId: string) {
  return useQuery({
    queryKey: TEST_KEYS.attempt(testId),
    queryFn: () => testsService.getAttemptByTestId(testId),
    enabled: !!testId,
  });
}

export function useStudentAttempts(page = 1) {
  return useQuery({
    queryKey: TEST_KEYS.studentAttempts(page),
    queryFn: () => testsService.getStudentAttempts(page),
  });
}

/**
 * Loads all data needed to execute a test:
 * - test metadata (from the paginated list)
 * - existing in-progress attempt (if any)
 * - full question objects (from attempt snapshot if resuming, or fetched individually)
 */
export function useExecutionData(testId: string) {
  return useQuery({
    queryKey: TEST_KEYS.execution(testId),
    queryFn: async () => {
      const [testsRes, attempt] = await Promise.all([
        testsService.getAvailableTests(1, 200),
        testsService.getAttemptByTestId(testId).catch(() => null),
      ]);

      const test = testsRes.tests.find((t) => t._id === testId);
      if (!test) throw new Error("Test non trovato");

      let questions: QuestionInterface[];

      if (attempt?.status === "in-progress") {
        questions = attempt.questions.map((aq) => aq.question);
      } else {
        const ids = (test.questions ?? []).map((q) =>
          typeof q.questionId === "string" ? q.questionId : q.questionId.$oid,
        );
        questions = await Promise.all(
          ids.map((id) => questionsService.loadQuestion(id)),
        );
      }

      return { test, attempt, questions };
    },
    enabled: !!testId,
    staleTime: 0, // always re-fetch on mount to catch in-progress attempts
  });
}

export function useCreateAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      attempt,
      password,
    }: {
      attempt: StudentAttemptInterface;
      password?: string;
    }) => testsService.createAttempt(attempt, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEST_KEYS.all }),
  });
}

export function useUpdateAttempt() {
  return useMutation({
    mutationFn: ({
      testId,
      attemptId,
      data,
    }: {
      testId: string;
      attemptId: string;
      data: Partial<StudentAttemptInterface>;
    }) => testsService.updateAttempt(testId, attemptId, data),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      testId,
      attemptId,
    }: {
      testId: string;
      attemptId: string;
    }) => testsService.submitAttempt(testId, attemptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEST_KEYS.all }),
  });
}
