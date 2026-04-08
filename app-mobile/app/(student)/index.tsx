import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import { useAuthStore } from "../../stores";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../constants";
import { useAvailableTests, TEST_KEYS } from "../../hooks/useTests";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { testsService } from "../../services";
import { StudentTestInterface } from "../../types";

// ---------------------------------------------------------------------------
// Compact test row used only in this screen
// ---------------------------------------------------------------------------
function UpcomingTestItem({ test }: { test: StudentTestInterface }) {
  const dueDate = test.availableTo
    ? new Date(test.availableTo).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <TouchableOpacity
      style={styles.testItem}
      onPress={() => router.push(`/(student)/tests/${test._id}/execute`)}
      accessibilityRole="button"
      accessibilityLabel={`Apri test ${test.name}`}
    >
      <View style={styles.testItemBody}>
        <Text style={styles.testItemName} numberOfLines={1}>
          {test.name}
        </Text>
        <Text style={styles.testItemSubject} numberOfLines={1}>
          {test.subjectName}
        </Text>
      </View>
      {dueDate && <Text style={styles.testItemDate}>Scade {dueDate}</Text>}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function TodoTestItem({
  test,
  isInProgress,
}: {
  test: StudentTestInterface;
  isInProgress: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.testItem}
      onPress={() => router.push(`/(student)/tests/${test._id}/execute`)}
      accessibilityRole="button"
      accessibilityLabel={`Apri test ${test.name}`}
    >
      <View style={styles.testItemBody}>
        <Text style={styles.testItemName} numberOfLines={1}>
          {test.name}
        </Text>
        <Text style={styles.testItemSubject} numberOfLines={1}>
          {test.subjectName}
        </Text>
      </View>
      <Badge
        label={isInProgress ? "In corso" : "Da iniziare"}
        variant={isInProgress ? "warning" : "neutral"}
      />
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Dashboard screen
// ---------------------------------------------------------------------------
export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);

  const {
    data: testsData,
    isLoading: testsLoading,
    refetch: refetchTests,
  } = useAvailableTests(1);

  // All published teacher tests — these are the candidates for both sections
  const teacherTests = useMemo(
    () =>
      (testsData?.tests ?? []).filter(
        (t) => t.source !== "self-evaluation" && t.status === "pubblicato",
      ),
    [testsData],
  );

  // Fetch attempt for every candidate test in parallel (same pattern as the web frontend)
  const attemptQueries = useQueries({
    queries: teacherTests.map((test) => ({
      queryKey: TEST_KEYS.attempt(test._id),
      queryFn: () => testsService.getAttemptByTestId(test._id),
      enabled: !!test._id,
    })),
  });

  const attemptsLoading = attemptQueries.some((q) => q.isLoading);

  // Stats: computed from real per-test attempt data
  const averageScore = useMemo(() => {
    const reviewed = teacherTests
      .map((_, i) => attemptQueries[i]?.data)
      .filter((a) => a?.status === "reviewed" && a.score != null && a.maxScore);
    if (!reviewed.length) return null;
    const total = reviewed.reduce(
      (sum, a) => sum + (a!.score! / a!.maxScore!) * 100,
      0,
    );
    return Math.round(total / reviewed.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherTests, ...attemptQueries.map((q) => q.data)]);

  const totalCompleted = useMemo(
    () =>
      teacherTests.filter((_, i) => {
        const s = attemptQueries[i]?.data?.status;
        return s === "delivered" || s === "reviewed";
      }).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teacherTests, ...attemptQueries.map((q) => q.data)],
  );

  // "Test da completare": not yet started or in-progress, max 5
  const todoTests = useMemo(
    () =>
      teacherTests
        .map((test, i) => ({
          test,
          attempt: attemptQueries[i]?.data ?? null,
        }))
        .filter(({ attempt }) => !attempt || attempt.status === "in-progress")
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teacherTests, ...attemptQueries.map((q) => q.data)],
  );

  // "Prossimi Test": sorted by nearest due date, max 4
  const upcomingTests = useMemo(() => {
    const now = new Date();
    return teacherTests
      .filter((t) => !t.availableTo || new Date(t.availableTo) > now)
      .sort((a, b) => {
        if (!a.availableTo) return 1;
        if (!b.availableTo) return -1;
        return (
          new Date(a.availableTo).getTime() - new Date(b.availableTo).getTime()
        );
      })
      .slice(0, 4);
  }, [teacherTests]);

  function onRefresh() {
    refetchTests();
  }

  const refreshing = testsLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Ciao, {user?.firstName ?? user?.username ?? "Studente"} 👋
        </Text>
        <Text style={styles.subtitle}>
          Ecco un riepilogo delle tue attività e performance.
        </Text>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statLabel}>Media Globale</Text>
          {attemptsLoading ? (
            <Loader />
          ) : (
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {averageScore != null ? `${averageScore}%` : "—"}
            </Text>
          )}
          <Text style={styles.statSubtitle}>calcolata sui test corretti</Text>
        </View>
        <View style={[styles.statCard, styles.statCardSecondary]}>
          <Text style={styles.statLabel}>Test Svolti</Text>
          {attemptsLoading ? (
            <Loader />
          ) : (
            <Text style={[styles.statValue, { color: Colors.secondary }]}>
              {totalCompleted}
            </Text>
          )}
          <Text style={styles.statSubtitle}> </Text>
        </View>
      </View>

      {/* Upcoming tests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prossimi Test</Text>
          <TouchableOpacity
            onPress={() => router.push("/(student)/tests")}
            accessibilityRole="button"
            accessibilityLabel="Vedi tutti i test"
          >
            <Text style={styles.sectionLink}>Vedi tutti →</Text>
          </TouchableOpacity>
        </View>

        {testsLoading ? (
          <Loader />
        ) : upcomingTests.length > 0 ? (
          <Card style={styles.testList}>
            {upcomingTests.map((test, index) => (
              <View key={test._id}>
                <UpcomingTestItem test={test} />
                {index < upcomingTests.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <Text style={styles.emptyText}>
              Ottimo! Non hai nessun test in scadenza imminente. 🎉
            </Text>
          </Card>
        )}
      </View>

      {/* Tests to complete */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Test da completare</Text>
          <TouchableOpacity
            onPress={() => router.push("/(student)/tests")}
            accessibilityRole="button"
            accessibilityLabel="Vedi tutti i test"
          >
            <Text style={styles.sectionLink}>Vedi tutti →</Text>
          </TouchableOpacity>
        </View>

        {testsLoading || attemptsLoading ? (
          <Loader />
        ) : todoTests.length > 0 ? (
          <Card style={styles.testList}>
            {todoTests.map(({ test, attempt }, index) => (
              <View key={test._id}>
                <TodoTestItem
                  test={test}
                  isInProgress={attempt?.status === "in-progress"}
                />
                {index < todoTests.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <Text style={styles.emptyText}>
              Nessun test da completare. Ottimo lavoro! 🎉
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing[4],
    paddingTop: Spacing[12],
    paddingBottom: Spacing[8],
  },

  // Header
  header: {
    marginBottom: Spacing[6],
  },
  greeting: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    ...Shadow.sm,
  },
  statCardPrimary: {
    backgroundColor: Colors.primarySurface,
  },
  statCardSecondary: {
    backgroundColor: Colors.secondaryLight,
  },
  statLabel: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  statValue: {
    fontSize: Typography.size["3xl"],
    fontWeight: "800",
    marginBottom: Spacing[1],
  },
  statSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  // Section
  section: {
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionLink: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Test list
  testList: {
    padding: 0,
    overflow: "hidden",
  },
  testItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  testItemBody: {
    flex: 1,
  },
  testItemName: {
    fontSize: Typography.size.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  testItemSubject: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  testItemDate: {
    fontSize: Typography.size.xs,
    color: Colors.warning,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 20,
    color: Colors.textDisabled,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing[4],
  },

  // Empty state
  emptyText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing[2],
  },
});
