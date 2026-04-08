import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { subjectsService } from "../services/subjectsService";
import { SubjectInterface } from "../types";
import { SUBJECT_ID_KEY } from "../services/apiClient";

interface SubjectsState {
  subjects: SubjectInterface[];
  selectedSubject: SubjectInterface | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  setSelectedSubject: (subject: SubjectInterface) => Promise<void>;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  selectedSubject: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().subjects.length > 0) return; // already loaded
    set({ isLoading: true, error: null });
    try {
      const subjects = await subjectsService.getSubjects();
      set({ subjects });

      const savedId = await SecureStore.getItemAsync(SUBJECT_ID_KEY);
      const restored = savedId
        ? (subjects.find((s) => s._id === savedId) ?? null)
        : null;

      // Persist and select: first restored, then first available
      const toSelect = restored ?? subjects[0] ?? null;
      if (toSelect) {
        await SecureStore.setItemAsync(SUBJECT_ID_KEY, toSelect._id);
        set({ selectedSubject: toSelect });
      }
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Errore caricamento materie",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedSubject: async (subject: SubjectInterface) => {
    await SecureStore.setItemAsync(SUBJECT_ID_KEY, subject._id);
    set({ selectedSubject: subject });
  },
}));
