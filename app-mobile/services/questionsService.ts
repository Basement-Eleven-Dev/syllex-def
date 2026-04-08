import { apiClient } from "./apiClient";
import { QuestionInterface } from "../types";

export const questionsService = {
  loadQuestion: (id: string): Promise<QuestionInterface> =>
    apiClient.get<QuestionInterface>(`questions/${id}`).then((r) => r.data),
};
