import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useLocalSearchParams,
  router,
  useFocusEffect,
  useNavigation,
} from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, Radius } from "../../../../constants";
import { useExecutionData, TEST_KEYS } from "../../../../hooks/useTests";
import { testsService } from "../../../../services/testsService";
import { QuestionInterface, StudentAttemptInterface } from "../../../../types";
import { Loader } from "../../../../components/ui";

// ─── Constants / helpers ──────────────────────────────────────────────────────

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── QuestionInput ─────────────────────────────────────────────────────────────

interface QuestionInputProps {
  question: QuestionInterface;
  index: number;
  answer: string | undefined;
  locked: boolean;
  onAnswer: (value: string) => void;
}

function QuestionInput({
  question,
  index,
  answer,
  locked,
  onAnswer,
}: QuestionInputProps) {
  const { type, options } = question;

  return (
    <View style={qStyles.card}>
      <View style={qStyles.header}>
        <Text style={qStyles.indexLabel}>Q{index + 1}</Text>
        {locked && (
          <View style={qStyles.lockedBadge}>
            <Text style={qStyles.lockedText}>🔒 Bloccata</Text>
          </View>
        )}
      </View>

      <Text style={qStyles.questionText}>{question.text}</Text>

      {/* Multiple choice */}
      {type === "scelta multipla" && options && options.length > 0 && (
        <View style={qStyles.options}>
          {options.map((opt, i) => {
            const isSelected = answer === opt.label;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  qStyles.option,
                  isSelected && qStyles.optionSelected,
                  locked && qStyles.optionDisabled,
                ]}
                onPress={() => {
                  if (locked) return;
                  onAnswer(isSelected ? "" : opt.label);
                }}
                disabled={locked}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: locked }}
              >
                <View
                  style={[
                    qStyles.letterBadge,
                    isSelected && qStyles.letterBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      qStyles.letterText,
                      isSelected && qStyles.letterTextSelected,
                    ]}
                  >
                    {LETTERS[i] ?? String(i + 1)}
                  </Text>
                </View>
                <Text
                  style={[
                    qStyles.optionText,
                    isSelected && qStyles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* True / False */}
      {type === "vero falso" && (
        <View style={qStyles.tfRow}>
          {(["Vero", "Falso"] as const).map((opt) => {
            const isSelected = answer === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  qStyles.tfBtn,
                  isSelected ? qStyles.tfBtnSelected : qStyles.tfBtnIdle,
                  locked && qStyles.optionDisabled,
                ]}
                onPress={() => {
                  if (locked) return;
                  onAnswer(isSelected ? "" : opt);
                }}
                disabled={locked}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: locked }}
              >
                <Text
                  style={[qStyles.tfText, isSelected && qStyles.tfTextSelected]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Open answer */}
      {type === "risposta aperta" && (
        <TextInput
          style={[qStyles.openInput, locked && qStyles.optionDisabled]}
          placeholder="Scrivi la tua risposta..."
          placeholderTextColor={Colors.textDisabled}
          value={answer ?? ""}
          onChangeText={(t) => !locked && onAnswer(t)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!locked}
          accessibilityLabel={`Risposta domanda ${index + 1}`}
        />
      )}
    </View>
  );
}

const qStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    gap: Spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  indexLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lockedBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  lockedText: {
    fontSize: Typography.size.xs,
    fontWeight: "600",
    color: Colors.warning,
  },
  questionText: {
    fontSize: Typography.size.base,
    fontWeight: "500",
    color: Colors.textPrimary,
    lineHeight: Typography.size.base * 1.6,
  },
  options: {
    gap: Spacing[2],
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    gap: Spacing[3],
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  letterBadgeSelected: {
    backgroundColor: Colors.primary,
  },
  letterText: {
    fontSize: Typography.size.sm,
    fontWeight: "800",
    color: Colors.gray500,
  },
  letterTextSelected: {
    color: Colors.white,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    lineHeight: Typography.size.base * 1.5,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  tfRow: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  tfBtn: {
    flex: 1,
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tfBtnIdle: {
    borderColor: Colors.gray200,
    backgroundColor: Colors.surface,
  },
  tfBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  tfText: {
    fontSize: Typography.size.md,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  tfTextSelected: {
    color: Colors.primary,
  },
  openInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    minHeight: 100,
    backgroundColor: Colors.surface,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type Answers = Record<string, string>;

export default function TestExecutionScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const qc = useQueryClient();
  const navigation = useNavigation();

  // Load all needed data in one query
  const { data: executionData, isLoading, isError } = useExecutionData(testId);

  // ── UI state ──
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ── Refs (avoid stale closures in timers/auto-save) ──
  const answersRef = useRef<Answers>({});
  const attemptRef = useRef<StudentAttemptInterface | null>(null);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep answersRef in sync
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Reset ALL execution state when the testId param changes.
  // Expo Router reuses this component instance across different [testId] navigations,
  // so useState/useRef values from a previous test would otherwise persist.
  useEffect(() => {
    setIsStarted(false);
    setIsSubmitting(false);
    setPassword("");
    setPasswordError(null);
    setAnswers({});
    setSecondsLeft(0);
    answersRef.current = {};
    attemptRef.current = null;
    startedAtRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, [testId]);

  // Cleanup timers on unmount + save progress if test is in progress
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Fire-and-forget: preserve answers if user navigates away mid-test
      const attempt = attemptRef.current;
      if (attempt?._id && testId) {
        const timeSpent = Math.floor(
          (Date.now() - startedAtRef.current) / 1000,
        );
        testsService.updateAttempt(testId, attempt._id, {
          testId,
          timeSpent,
          questions: attempt.questions.map((aq) => ({
            question: aq.question,
            answer: answersRef.current[aq.question._id] ?? null,
            points: aq.points,
          })),
        });
      }
    };
  }, []);

  // Redirect if the attempt is already submitted (delivered/reviewed)
  useEffect(() => {
    if (!executionData) return;
    const { attempt } = executionData;
    if (attempt && attempt.status !== "in-progress") {
      router.replace(`/(student)/tests/${testId}/review` as never);
    }
  }, [executionData, testId]);

  // Warn user before navigating away while a test is in progress.
  // We cover two distinct navigation vectors:
  // 1. Stack pop (back button / swipe) → "beforeRemove" on the stack navigator
  // 2. Tab bar tap → "tabPress" on the parent tab navigator
  useEffect(() => {
    if (!isStarted || isSubmitting) return;

    const showAlert = (onConfirm: () => void) => {
      Alert.alert(
        "Test in corso",
        "Hai un test in corso. Le tue risposte sono salvate automaticamente e potrai riprendere il test in qualsiasi momento.",
        [
          { text: "Rimani nel test", style: "cancel" },
          { text: "Esci", style: "destructive", onPress: onConfirm },
        ],
      );
    };

    // ── Stack guard (back / swipe back) ──────────────────────────────────────
    const unsubStack = (navigation as any).addListener(
      "beforeRemove",
      (e: any) => {
        e.preventDefault();
        showAlert(() => (navigation as any).dispatch(e.data.action));
      },
    );

    // ── Tab guard (bottom bar taps) ───────────────────────────────────────────
    const tabParent = (navigation as any).getParent?.();
    let unsubTab: (() => void) | undefined;

    if (tabParent) {
      unsubTab = tabParent.addListener("tabPress", (e: any) => {
        e.preventDefault();
        const state: any = tabParent.getState?.();
        const route = state?.routes?.find((r: any) => r.key === e.target);
        showAlert(() => {
          if (route) tabParent.navigate(route.name);
        });
      });
    }

    return () => {
      unsubStack();
      unsubTab?.();
    };
  }, [navigation, isStarted, isSubmitting]);

  // ── Derived values ──
  const test = executionData?.test;
  const questions = executionData?.questions ?? [];
  const isResuming = executionData?.attempt?.status === "in-progress";
  const hasTimeLimit = (test?.timeLimit ?? 0) > 0;
  // Guard with isStarted: secondsLeft is 0 on mount/reset, which must not count as expired.
  const timerExpired = isStarted && hasTimeLimit && secondsLeft <= 0;
  const answeredCount = Object.values(answers).filter(
    (v) => v !== null && v !== undefined && v !== "",
  ).length;

  // ── Timer ──
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (timeLimitMinutes: number, startedAtMs: number) => {
      // Always clear any existing interval before starting a new one
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      const remaining = Math.max(timeLimitMinutes * 60 - elapsed, 0);
      setSecondsLeft(remaining);
      if (remaining <= 0) return;

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopTimer],
  );

  // ── Auto-save ──
  const buildPayload = useCallback(
    (timeOverride?: number): Partial<StudentAttemptInterface> => {
      const attempt = attemptRef.current;
      const timeSpent =
        timeOverride ?? Math.floor((Date.now() - startedAtRef.current) / 1000);
      return {
        testId: testId!,
        timeSpent,
        questions: (attempt?.questions ?? []).map((aq) => ({
          question: aq.question,
          answer: answersRef.current[aq.question._id] ?? null,
          points: aq.points,
        })),
      };
    },
    [testId],
  );

  const persistToDb = useCallback(async () => {
    const attempt = attemptRef.current;
    if (!attempt?._id || !testId) return;
    try {
      await testsService.updateAttempt(testId, attempt._id, buildPayload());
    } catch {
      // silent fail — next debounce will retry
    }
  }, [testId, buildPayload]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistToDb, 5000);
  }, [persistToDb]);

  // ── Pause/resume timer on tab switch (screen focus changes) ──
  useFocusEffect(
    useCallback(() => {
      // Re-enter: restart timer if test is running (recalculates elapsed time)
      if (isStarted && test?.timeLimit && startedAtRef.current > 0) {
        startTimer(test.timeLimit, startedAtRef.current);
      }
      return () => {
        stopTimer();
        // Flush any pending debounced save immediately on blur
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        persistToDb();
      };
    }, [isStarted, test?.timeLimit, startTimer, stopTimer, persistToDb]),
  );

  // ── Answer change ──
  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      const question = questions.find((q) => q._id === questionId);
      if (!question) return;

      // One-shot: block re-answering closed questions
      if (test?.oneShotAnswers && question.type !== "risposta aperta") {
        const existing = answersRef.current[questionId];
        if (existing !== null && existing !== undefined && existing !== "") {
          return;
        }
      }

      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      scheduleSave();
    },
    [questions, test, scheduleSave],
  );

  const isQuestionLocked = useCallback(
    (question: QuestionInterface): boolean => {
      if (timerExpired) return true;
      if (test?.oneShotAnswers && question.type !== "risposta aperta") {
        const ans = answersRef.current[question._id];
        return ans !== null && ans !== undefined && ans !== "";
      }
      return false;
    },
    [timerExpired, test],
  );

  // ── Start / Resume ──
  const createMutation = useMutation({
    mutationFn: (vars: {
      attempt: StudentAttemptInterface;
      password?: string;
    }) => testsService.createAttempt(vars.attempt, vars.password),
  });

  const handleStart = useCallback(async () => {
    if (!test || !testId) return;

    // Password validation
    if (test.isPasswordProtected && !isResuming) {
      if (!password.trim()) {
        setPasswordError("Inserisci la password per avviare il test");
        return;
      }
    }
    setPasswordError(null);

    if (isResuming) {
      // Restore answers from attempt
      const attempt = executionData!.attempt!;
      attemptRef.current = attempt;
      const restored: Answers = {};
      for (const q of attempt.questions) {
        if (q.answer !== null && q.answer !== undefined) {
          restored[q.question._id] = String(q.answer);
        }
      }
      setAnswers(restored);
      startedAtRef.current = new Date(attempt.startedAt).getTime();
      setIsStarted(true);
      // useFocusEffect will start the timer when isStarted becomes true
      return;
    }

    // New attempt
    const attemptPayload: StudentAttemptInterface = {
      testId: testId!,
      subjectId: test.subjectId,
      teacherId: test.teacherId,
      status: "in-progress",
      startedAt: new Date().toISOString(),
      timeSpent: 0,
      questions: questions.map((q) => {
        const testQ = test.questions?.find((tq) => {
          const id =
            typeof tq.questionId === "string"
              ? tq.questionId
              : tq.questionId.$oid;
          return id === q._id;
        });
        return { question: q, answer: null, points: testQ?.points ?? 0 };
      }),
    };

    try {
      const created = await createMutation.mutateAsync({
        attempt: attemptPayload,
        password: password || undefined,
      });
      attemptRef.current = created;
      startedAtRef.current = new Date(created.startedAt).getTime();
      setIsStarted(true);
      // useFocusEffect will start the timer when isStarted becomes true
      qc.invalidateQueries({ queryKey: TEST_KEYS.all });
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setPasswordError("Password errata. Riprova.");
      } else {
        Alert.alert("Errore", "Impossibile avviare il test. Riprova.");
      }
    }
  }, [
    test,
    testId,
    isResuming,
    password,
    questions,
    executionData,
    createMutation,
    qc,
  ]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    Alert.alert(
      "Consegna test",
      "Sei sicuro di voler consegnare il test? Non potrai più modificarlo.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Consegna",
          style: "destructive",
          onPress: async () => {
            const attempt = attemptRef.current;
            if (!attempt?._id || !testId) return;
            setIsSubmitting(true);
            stopTimer();
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            try {
              // Final save with exact timeSpent
              const timeSpent = Math.floor(
                (Date.now() - startedAtRef.current) / 1000,
              );
              await testsService.updateAttempt(
                testId,
                attempt._id,
                buildPayload(timeSpent),
              );
              await testsService.submitAttempt(testId, attempt._id);
              qc.invalidateQueries({ queryKey: TEST_KEYS.all });
              router.replace("/(student)/tests" as never);
            } catch {
              setIsSubmitting(false);
              Alert.alert("Errore", "Impossibile consegnare il test. Riprova.");
            }
          },
        },
      ],
    );
  }, [testId, stopTimer, buildPayload, qc]);

  // ── Render helpers ──
  const renderQuestion: ListRenderItem<QuestionInterface> = useCallback(
    ({ item, index }) => (
      <QuestionInput
        question={item}
        index={index}
        answer={answers[item._id]}
        locked={isQuestionLocked(item)}
        onAnswer={(v) => handleAnswer(item._id, v)}
      />
    ),
    [answers, isQuestionLocked, handleAnswer],
  );

  // ── Loading / error states ──
  if (isLoading) return <Loader fullScreen />;

  if (isError || !test) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.replace("/(student)/tests" as never)}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← Torna ai test</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Test non disponibile</Text>
          <Text style={styles.errorDesc}>
            Impossibile caricare i dati del test.
          </Text>
        </View>
      </View>
    );
  }

  // ── Pre-start screen ──
  if (!isStarted) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.replace("/(student)/tests" as never)}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>← Torna ai test</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.preStartContent}>
          <View style={styles.preStartCard}>
            <Text style={styles.preStartHint}>
              {isResuming
                ? "Hai un tentativo in corso per"
                : "Stai per svolgere il test"}
            </Text>
            <Text style={styles.preStartTitle}>{test.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>📝 {questions.length} domande</Text>
              {(test.timeLimit ?? 0) > 0 && (
                <Text style={styles.metaChip}>⏱ {test.timeLimit} minuti</Text>
              )}
            </View>

            {test.availableTo && (
              <View style={styles.deadlineBanner}>
                <Text style={styles.deadlineBannerText}>
                  ⚠️ Da consegnare entro il {formatDeadline(test.availableTo)}
                </Text>
              </View>
            )}

            {test.oneShotAnswers && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  🔒 Modalità One-Shot: la prima risposta data per ogni domanda
                  chiusa è definitiva.
                </Text>
              </View>
            )}

            {test.isPasswordProtected && !isResuming && (
              <View style={styles.passwordSection}>
                <Text style={styles.passwordLabel}>
                  🔐 Questo test è protetto da password
                </Text>
                <TextInput
                  style={[
                    styles.passwordInput,
                    !!passwordError && styles.passwordInputError,
                  ]}
                  placeholder="Inserisci la password del test"
                  placeholderTextColor={Colors.textDisabled}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  accessibilityLabel="Password del test"
                />
                {passwordError && (
                  <Text style={styles.passwordErrorText}>{passwordError}</Text>
                )}
              </View>
            )}

            <View style={styles.preStartActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => router.replace("/(student)/tests" as never)}
                accessibilityRole="button"
              >
                <Text style={styles.btnSecondaryText}>Torna alla lista</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  isResuming && styles.btnWarning,
                  createMutation.isPending && styles.btnDisabled,
                ]}
                onPress={handleStart}
                disabled={createMutation.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.btnPrimaryText}>
                  {createMutation.isPending
                    ? "Avvio..."
                    : isResuming
                      ? "▶ Riprendi test"
                      : "▶ Avvia test"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Execution screen ──
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Sticky header */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <View style={styles.execHeaderRow}>
          <View style={styles.execHeaderLeft}>
            <Text style={styles.execTitle} numberOfLines={1}>
              {test.name}
            </Text>
            <Text style={styles.execSubtitle}>
              {answeredCount}/{questions.length} risposte
            </Text>
          </View>

          {hasTimeLimit && (
            <View
              style={[
                styles.timerBadge,
                secondsLeft <= 60 && secondsLeft > 0 && styles.timerBadgeDanger,
                timerExpired && styles.timerBadgeExpired,
              ]}
            >
              <Text style={styles.timerText}>
                {formatCountdown(secondsLeft)}
              </Text>
            </View>
          )}
        </View>

        {timerExpired && (
          <View style={styles.bannerWarning}>
            <Text style={styles.bannerText}>
              ⏰ Tempo scaduto. Consegna il test.
            </Text>
          </View>
        )}
        {test.oneShotAnswers && (
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerText}>
              🔒 One-Shot: la prima risposta per le domande chiuse è definitiva.
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Questions list */}
      <FlatList
        data={questions}
        keyExtractor={(item) => item._id}
        renderItem={renderQuestion}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      {/* Sticky submit footer */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Consegna test"
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? "Consegna in corso..." : "Consegna test"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ── Top bar ──
  topBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    paddingTop: Spacing[3],
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  // ── Execution header ──
  execHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: Spacing[3],
    gap: Spacing[3],
  },
  execHeaderLeft: {
    flex: 1,
    gap: Spacing[1],
  },
  execTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  execSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  timerBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
  },
  timerBadgeDanger: {
    backgroundColor: Colors.dangerLight,
  },
  timerBadgeExpired: {
    backgroundColor: Colors.danger,
  },
  timerText: {
    fontSize: Typography.size.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  // ── Banners ──
  bannerWarning: {
    marginTop: Spacing[2],
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing[2],
  },
  bannerInfo: {
    marginTop: Spacing[2],
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    padding: Spacing[2],
  },
  bannerText: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
  },
  // ── List ──
  listContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[4],
  },
  // ── Submit footer ──
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: Typography.size.base,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  // ── Pre-start ──
  preStartContent: {
    flex: 1,
    padding: Spacing[4],
    justifyContent: "center",
  },
  preStartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[6],
    gap: Spacing[4],
  },
  preStartHint: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  preStartTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    lineHeight: Typography.size["2xl"] * 1.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing[2],
    justifyContent: "center",
    flexWrap: "wrap",
  },
  metaChip: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  deadlineBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  deadlineBannerText: {
    fontSize: Typography.size.sm,
    color: Colors.warning,
    fontWeight: "500",
    textAlign: "center",
  },
  warningBanner: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  warningBannerText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    textAlign: "center",
  },
  passwordSection: {
    gap: Spacing[2],
  },
  passwordLabel: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  passwordInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  passwordInputError: {
    borderColor: Colors.danger,
  },
  passwordErrorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
  },
  preStartActions: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: Typography.size.base,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: "center",
  },
  btnWarning: {
    backgroundColor: Colors.warning,
  },
  btnPrimaryText: {
    fontSize: Typography.size.base,
    fontWeight: "700",
    color: Colors.white,
  },
  // ── Error ──
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing[8],
    gap: Spacing[2],
  },
  errorTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  errorDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
