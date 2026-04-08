import { useQuery } from "@tanstack/react-query";
import { comunicazioniService } from "../services/comunicazioniService";
import {
  subjectsService,
  materialsService,
} from "../services/materialsService";

export function useComunicazioni(page = 1) {
  return useQuery({
    queryKey: ["communications", page],
    queryFn: () => comunicazioniService.getAll(page),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsService.getAll(),
    staleTime: 1000 * 60 * 10, // subjects rarely change
  });
}

export function useMaterials(subjectId?: string, topicId?: string) {
  return useQuery({
    queryKey: ["materials", subjectId, topicId],
    queryFn: () => materialsService.getAll(subjectId, topicId),
  });
}
