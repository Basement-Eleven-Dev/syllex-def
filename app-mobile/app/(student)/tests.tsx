import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueries } from "@tanstack/react-query";
import { Colors, Typography, Spacing, Radius } from "../../constants";
import { useAvailableTests, TEST_KEYS } from "../../hooks/useTests";
import { testsService } from "../../services/testsService";
import { useSubjectsStore } from "../../stores";
import {
  StudentTestInterface,
  StudentAttemptInterface,
  SubjectInterface,
} from "../../types";
import { Loader, TestCard } from "../../components/ui";

const PAGE_SIZE = 10;

type AttemptStatusFilter = StudentAttemptInterface["status"] | "not-started";

const STATUS_OPTIONS: { label: string; value: AttemptStatusFilter | null }[] = [
  { label: "Tutti", value: null },
  { label: "Non iniziato", value: "not-started" },
  { label: "In corso", value: "in-progress" },
  { label: "Consegnato", value: "delivered" },
  { label: "Corretto", value: "reviewed" },
];

export default function TestsScreen() {
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<
    string | undefined
  >(undefined);
  const [selectedAttemptStatus, setSelectedAttemptStatus] =
    useState<AttemptStatusFilter | null>(null);
  const [page, setPage] = useState(1);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);

  const subjects = useSubjectsStore((s) => s.subjects);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const handleSubjectSelect = useCallback(
    (subject: SubjectInterface | null) => {
      setSelectedSubjectId(subject?._id);
      setPage(1);
      setSubjectPickerVisible(false);
    },
    [],
  );

  const handleStatusSelect = useCallback(
    (status: AttemptStatusFilter | null) => {
      setSelectedAttemptStatus(status);
      setPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedSubjectId(undefined);
    setSelectedAttemptStatus(null);
    setPage(1);
  }, []);

  const { data, isLoading, isError, refetch } = useAvailableTests(
    page,
    search || undefined,
    selectedSubjectId,
  );

  const tests = data?.tests ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch attempt status for each test on the current page (shared cache with TestCard)
  const attemptQueries = useQueries({
    queries: tests.map((test) => ({
      queryKey: TEST_KEYS.attempt(test._id),
      queryFn: () => testsService.getAttemptByTestId(test._id),
    })),
  });

  const filteredTests = useMemo(() => {
    if (!selectedAttemptStatus) return tests;
    return tests.filter((_, i) => {
      const q = attemptQueries[i];
      if (!q || q.isLoading) return true; // include while loading
      const status = q.data?.status ?? null;
      if (selectedAttemptStatus === "not-started") return status === null;
      return status === selectedAttemptStatus;
    });
  }, [tests, selectedAttemptStatus, attemptQueries]);

  const selectedSubjectName =
    subjects.find((s) => s._id === selectedSubjectId)?.name ??
    "Tutte le materie";
  const hasActiveFilters =
    !!search || !!selectedSubjectId || !!selectedAttemptStatus;

  const renderTest: ListRenderItem<StudentTestInterface> = useCallback(
    ({ item }) => <TestCard test={item} />,
    [],
  );

  return (
    <View style={styles.root}>
      {/* ── Sticky header ── */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>I miei test</Text>
          {total > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{total}</Text>
            </View>
          )}
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍  Cerca test..."
            placeholderTextColor={Colors.textDisabled}
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Cerca test"
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.searchClear}
              onPress={() => handleSearchChange("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Cancella ricerca"
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !!selectedSubjectId && styles.chipActive]}
            onPress={() => setSubjectPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filtra per materia"
          >
            <Text
              style={[
                styles.chipText,
                !!selectedSubjectId && styles.chipTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedSubjectId ? selectedSubjectName : "Tutte le materie"} ▾
            </Text>
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.chipClear}
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Pulisci filtri"
            >
              <Text style={styles.chipClearText}>✕ Pulisci</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsRow}
          style={styles.statusChipsScroll}
        >
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value ?? "__all__"}
              style={[
                styles.chip,
                selectedAttemptStatus === opt.value && styles.chipActive,
              ]}
              onPress={() => handleStatusSelect(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedAttemptStatus === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* ── Content ── */}
      {isLoading && !data ? (
        <Loader />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Qualcosa è andato storto</Text>
          <Text style={styles.stateDesc}>Impossibile caricare i test.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            accessibilityRole="button"
          >
            <Text style={styles.retryBtnText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          keyExtractor={(item) => item._id}
          renderItem={renderTest}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Nessun test disponibile</Text>
              <Text style={styles.stateDesc}>
                {hasActiveFilters
                  ? "Prova a cambiare i filtri."
                  : "Non ci sono test assegnati al momento."}
              </Text>
            </View>
          }
          ListFooterComponent={
            total > PAGE_SIZE && !selectedAttemptStatus ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnOff]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  accessibilityRole="button"
                  accessibilityLabel="Pagina precedente"
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      page === 1 && styles.pageBtnTextOff,
                    ]}
                  >
                    ‹
                  </Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnOff,
                  ]}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  accessibilityRole="button"
                  accessibilityLabel="Pagina successiva"
                >
                  <Text
                    style={[
                      styles.pageBtnText,
                      page >= totalPages && styles.pageBtnTextOff,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* ── Subject picker modal ── */}
      <Modal
        visible={subjectPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSubjectPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSubjectPickerVisible(false)}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Scegli la materia</Text>
            <FlatList
              data={[null, ...subjects] as (SubjectInterface | null)[]}
              keyExtractor={(item) => item?._id ?? "__all__"}
              renderItem={({ item }) => {
                const active =
                  item === null
                    ? !selectedSubjectId
                    : selectedSubjectId === item._id;
                return (
                  <TouchableOpacity
                    style={[styles.sheetItem, active && styles.sheetItemActive]}
                    onPress={() => handleSubjectSelect(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item === null ? "Tutte le materie" : item.name
                    }
                  >
                    <Text
                      style={[
                        styles.sheetItemText,
                        active && styles.sheetItemTextActive,
                      ]}
                    >
                      {item === null ? "Tutte le materie" : item.name}
                    </Text>
                    {active && <Text style={styles.sheetItemCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ── Header ──
  topBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    paddingTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
    color: Colors.white,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  searchClear: {
    padding: Spacing[1],
  },
  searchClearText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  chipsRow: {
    flexDirection: "row",
    gap: Spacing[2],
    alignItems: "center",
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  chipText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  chipClear: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  chipClearText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    fontWeight: "600",
  },
  statusChipsScroll: {
    marginTop: Spacing[2],
  },
  statusChipsRow: {
    flexDirection: "row",
    gap: Spacing[2],
    alignItems: "center",
    paddingRight: Spacing[4],
  },
  // ── List ──
  list: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  stateBox: {
    paddingTop: Spacing[16],
    alignItems: "center",
    paddingHorizontal: Spacing[8],
    gap: Spacing[2],
  },
  stateTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  stateDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
  },
  retryBtnText: {
    fontSize: Typography.size.base,
    fontWeight: "600",
    color: Colors.white,
  },
  // ── Pagination ──
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing[5],
    paddingVertical: Spacing[4],
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnOff: {
    backgroundColor: Colors.gray200,
  },
  pageBtnText: {
    fontSize: Typography.size.xl,
    fontWeight: "700",
    color: Colors.white,
  },
  pageBtnTextOff: {
    color: Colors.textDisabled,
  },
  pageInfo: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: "500",
    minWidth: 60,
    textAlign: "center",
  },
  // ── Modal sheet ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
  },
  sheetTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2],
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetItemActive: {
    backgroundColor: Colors.primarySurface,
  },
  sheetItemText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  sheetItemTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  sheetItemCheck: {
    fontSize: Typography.size.base,
    color: Colors.primary,
    fontWeight: "700",
  },
});
