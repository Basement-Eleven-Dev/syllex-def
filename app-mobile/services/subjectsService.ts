import { apiClient } from "./apiClient";
import { SubjectInterface } from "../types";

export const subjectsService = {
  getSubjects: () =>
    apiClient.get<SubjectInterface[]>("subjects").then((r) => r.data),
};
