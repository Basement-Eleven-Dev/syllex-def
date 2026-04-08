import { apiClient } from "./apiClient";
import { MaterialInterface, SubjectInterface } from "../types";

export const subjectsService = {
  getAll: () =>
    apiClient
      .get<{ subjects: SubjectInterface[] }>("subjects")
      .then((r) => r.data.subjects),
};

export const materialsService = {
  getAll: (subjectId?: string, topicId?: string) =>
    apiClient
      .get<{ materials: MaterialInterface[] }>("materials", {
        params: {
          ...(subjectId && { subjectId }),
          ...(topicId && { topicId }),
        },
      })
      .then((r) => r.data.materials),
};
