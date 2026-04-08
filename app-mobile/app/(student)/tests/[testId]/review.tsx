import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Colors, Spacing, Typography, Radius } from "../../../../constants";
import { useAttemptByTestId } from "../../../../hooks/useTests";
import { AttemptQuestionData } from "../../../../types";
import { Loader } from "../../../../components/ui";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function answeredCount(questions: AttemptQuestionData[]): number {
  return questions.filter(
    (q) => q.answer !== null && q.answer !== undefined && q.answer !== "",
  ).length;
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  item: AttemptQuestionData;
  index: number;
  feedbackLabel: string;
}

function QuestionCard({ item, index, feedbackLabel }: QuestionCardProps) {
  const { question, answer, score, points, status, teacherComment } = item;

  const statusColor: string =
    status === "correct"
      ? Colors.success
      : status === "wrong"
        ? Colors.danger
        : status === "semi-correct"
          ? Colors.warning
          : Colors.gray300;

  const statusLabel =
    status === "correct"
      ? "✓ Corretta"
      : status === "wrong"
        ? "✗ Errata"
        : status === "semi-correct"
          ? "◑ Parziale"
          : null;

  return (
    <View style={[qStyles.card, { borderLeftColor: statusColor }]}>
      {/* Header */}
      <View style={qStyles.header}>
        <Text style={qStyles.indexLabel}>Q{index + 1}</Text>
        {statusLabel && (
          <View
            style={[
              qStyles.statusChip,
              { backgroundColor: statusColor + "22" },
            ]}
          >
            <Text style={[qStyles.statusChipText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        )}
        {score !== undefined && points !== undefined && (
          <Text style={qStyles.scoreText}>
            {score?.toFixed(1)}/{points.toFixed(1)} pt
          </Text>
        )}
      </View>

      {/* Question text */}
      <Text style={qStyles.questionText}>{question.text}</Text>

      {/* Multiple choice options */}
      {question.options && question.options.length > 0 && (
        <View style={qStyles.options}>
          {question.options.map((opt, i) => {
            const isSelected =
              answer !== null && answer !== undefined && answer === opt.label;
            const isCorrect = opt.isCorrect === true;

            let bgColor: string = Colors.surface;
            let borderColor: string = Colors.gray200;
            let letterBg: string = Colors.gray100;
            let letterColor: string = Colors.gray500;
            let textColor: string = Colors.textPrimary;

            if (isSelected && isCorrect) {
              bgColor = Colors.successLight;
              borderColor = Colors.success;
              letterBg = Colors.success;
              letterColor = Colors.white;
            } else if (isSelected && !isCorrect) {
              bgColor = Colors.dangerLight;
              borderColor = Colors.danger;
              letterBg = Colors.danger;
              letterColor = Colors.white;
            } else if (!isSelected && isCorrect) {
              bgColor = Colors.successLight;
              borderColor = Colors.success;
              letterBg = Colors.success;
              letterColor = Colors.white;
              textColor = Colors.success;
            }

            return (
              <View
                key={i}
                style={[
                  qStyles.option,
                  { backgroundColor: bgColor, borderColor },
                ]}
              >
                <View
                  style={[qStyles.optionLetter, { backgroundColor: letterBg }]}
                >
                  <Text
                    style={[qStyles.optionLetterText, { color: letterColor }]}
                  >
                    {LETTERS[i] ?? String(i + 1)}
                  </Text>
                </View>
                <Text style={[qStyles.optionText, { color: textColor }]}>
                  {opt.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* True / False */}
      {question.type === "vero falso" && (
        <View style={qStyles.options}>
          {(["Vero", "Falso"] as const).map((opt) => {
            const isSelected = answer === opt;
            const isCorrect = (opt === "Vero") === question.correctAnswer;

            let bgColor: string = Colors.surface;
            let borderColor: string = Colors.gray200;
            let letterBg: string = Colors.gray100;
            let letterColor: string = Colors.gray500;
            let textColor: string = Colors.textPrimary;

            if (isSelected && isCorrect) {
              bgColor = Colors.successLight;
              borderColor = Colors.success;
              letterBg = Colors.success;
              letterColor = Colors.white;
            } else if (isSelected && !isCorrect) {
              bgColor = Colors.dangerLight;
              borderColor = Colors.danger;
              letterBg = Colors.danger;
              letterColor = Colors.white;
            } else if (!isSelected && isCorrect) {
              bgColor = Colors.successLight;
              borderColor = Colors.success;
              letterBg = Colors.success;
              letterColor = Colors.white;
              textColor = Colors.success;
            }

            return (
              <View
                key={opt}
                style={[
                  qStyles.option,
                  { backgroundColor: bgColor, borderColor },
                ]}
              >
                <View
                  style={[qStyles.optionLetter, { backgroundColor: letterBg }]}
                >
                  <Text
                    style={[qStyles.optionLetterText, { color: letterColor }]}
                  >
                    {opt === "Vero" ? "V" : "F"}
                  </Text>
                </View>
                <Text style={[qStyles.optionText, { color: textColor }]}>
                  {opt}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Open answer — student */}
      {question.type === "risposta aperta" &&
        answer !== null &&
        answer !== "" && (
          <View style={qStyles.openBox}>
            <Text style={qStyles.openLabel}>La tua risposta</Text>
            <Text style={qStyles.openText}>{String(answer)}</Text>
          </View>
        )}

      {/* Teacher / AI feedback */}
      {teacherComment && (
        <View style={qStyles.commentBox}>
          <Text style={qStyles.commentLabel}>{feedbackLabel}</Text>
          <Text style={qStyles.commentText}>{teacherComment}</Text>
        </View>
      )}
    </View>
  );
}

const qStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: Colors.border,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    gap: Spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    flexWrap: "wrap",
  },
  indexLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusChip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
  },
  scoreText: {
    marginLeft: "auto" as never,
    fontSize: Typography.size.sm,
    fontWeight: "700",
    color: Colors.primary,
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
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    gap: Spacing[3],
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  optionLetterText: {
    fontSize: Typography.size.sm,
    fontWeight: "800",
  },
  optionText: {
    flex: 1,
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * 1.5,
  },
  openBox: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: Spacing[1],
  },
  openLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  openText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    lineHeight: Typography.size.base * 1.5,
  },
  commentBox: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    padding: Spacing[3],
    gap: Spacing[1],
  },
  commentLabel: {
    fontSize: Typography.size.xs,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentText: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.size.sm * 1.6,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TestReviewScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { data: attempt, isLoading, isError } = useAttemptByTestId(testId);

  const renderQuestion: ListRenderItem<AttemptQuestionData> = useCallback(
    ({ item, index }) => (
      <QuestionCard
        item={item}
        index={index}
        feedbackLabel={
          attempt?.source === "self-evaluation"
            ? "Commento dell'AI"
            : "Commento del docente"
        }
      />
    ),
    [attempt?.source],
  );

  if (isLoading) return <Loader fullScreen />;

  if (isError || !attempt || attempt.status === "in-progress") {
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
            Nessun tentativo consegnato trovato per questo test.
          </Text>
        </View>
      </View>
    );
  }

  const isAutoEvaluation = attempt.source === "self-evaluation";
  const isReviewed = attempt.status === "reviewed";

  const totalScore = attempt.questions
    .reduce((s, q) => s + (q.score ?? 0), 0)
    .toFixed(1);
  const maxScore = attempt.questions
    .reduce((s, q) => s + (q.points ?? 0), 0)
    .toFixed(1);
  const correctCount = attempt.questions.filter(
    (q) => q.status === "correct",
  ).length;
  const wrongCount = attempt.questions.filter(
    (q) => q.status === "wrong",
  ).length;

  const statusLabel =
    attempt.status === "delivered"
      ? "Consegnato"
      : isAutoEvaluation
        ? "Corretto dall'AI"
        : "Corretto dal docente";

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.metaRow}>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>{statusLabel}</Text>
        </View>
        {attempt.timeSpent > 0 && (
          <Text style={styles.metaText}>⏱ {formatTime(attempt.timeSpent)}</Text>
        )}
        {attempt.deliveredAt && (
          <Text style={styles.metaText}>{formatDate(attempt.deliveredAt)}</Text>
        )}
      </View>

      <Text style={styles.subHead}>
        {attempt.questions.length} domande · {answeredCount(attempt.questions)}{" "}
        risposte fornite
      </Text>

      {isReviewed && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalScore}
              <Text style={styles.statSub}>/{maxScore}</Text>
            </Text>
            <Text style={styles.statLabel}>Punteggio</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {correctCount}
              <Text style={styles.statSub}> ✓</Text>
            </Text>
            <Text style={styles.statLabel}>Corrette</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.danger }]}>
              {wrongCount}
              <Text style={styles.statSub}> ✗</Text>
            </Text>
            <Text style={styles.statLabel}>Errate</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Domande</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace("/(student)/tests" as never)}
          accessibilityRole="button"
          accessibilityLabel="Torna ai test"
        >
          <Text style={styles.backText}>← Torna ai test</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Riepilogo test</Text>
      </SafeAreaView>

      <FlatList
        data={attempt.questions}
        keyExtractor={(item) => item.question._id}
        renderItem={renderQuestion}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing[1],
  },
  backText: {
    paddingTop: Spacing[3],
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  listHeader: {
    marginBottom: Spacing[4],
    gap: Spacing[3],
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[2],
    alignItems: "center",
  },
  statusChip: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  statusChipText: {
    fontSize: Typography.size.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  metaText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  subHead: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    alignItems: "center",
    gap: Spacing[1],
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  statSub: {
    fontSize: Typography.size.sm,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing[2],
  },
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
