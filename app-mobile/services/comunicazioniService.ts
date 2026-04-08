import { apiClient } from "./apiClient";
import { CommunicationInterface } from "../types";

interface CommunicationsResponse {
  communications: CommunicationInterface[];
  total: number;
}

export const comunicazioniService = {
  getAll: (page = 1, pageSize = 20) =>
    apiClient
      .get<CommunicationsResponse>("communications", {
        params: { page, pageSize },
      })
      .then((r) => r.data),

  markAsRead: (communicationId: string) =>
    apiClient
      .post(`communications/${communicationId}/read`)
      .then((r) => r.data),
};
