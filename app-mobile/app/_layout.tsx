import "../services/amplify"; // Amplify must be configured before anything
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore, useSubjectsStore } from "../stores";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeSubjects = useSubjectsStore((s) => s.initialize);

  useEffect(() => {
    initialize().then(() => initializeSubjects());
  }, [initialize, initializeSubjects]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
      </Stack>
    </QueryClientProvider>
  );
}
