import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants";
import { StudentTestInterface, StudentAttemptInterface } from "../../types";
import { useAttemptByTestId } from "../../hooks/useTests";
import { Card } from "./Card";
import { Badge } from "./Badge";

type AttemptStatus = StudentAttemptInterface["status"];

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCtaLabel(status: AttemptStatus | null | undefined): string {
  if (status === "reviewed") return "Vedi correzione";
  if (status === "delivered") return "Rivedi test";
  if (status === "in-progress") return "Riprendi test";
  return "Compila test";
}

function getCtaVariant(
  status: AttemptStatus | null | undefined,
): "primary" | "warning" | "success" {
  if (status === "in-progress") return "warning";
  if (status === "delivered" || status === "reviewed") return "success";
  return "primary";
}

function getAttemptBadge(
  status: AttemptStatus | null | undefined,
): {
  label: string;
  variant: "primary" | "success" | "warning" | "neutral";
} | null {
  if (status === "reviewed") return { label: "Corretto", variant: "success" };
  if (status === "delivered")
    return { label: "Consegnato", variant: "primary" };
  if (status === "in-progress")
    return { label: "In corso", variant: "warning" };
  return null;
}

interface TestCardProps {
  test: StudentTestInterface;
}

export function TestCard({ test }: TestCardProps) {
  const { data: attempt } = useAttemptByTestId(test._id);
  const status = attempt?.status ?? null;

  const questionsCount = test.questions?.length ?? 0;
  const maxScore = (test.questions ?? []).reduce((sum, q) => sum + q.points, 0);

  const isCompleted = status === "delivered" || status === "reviewed";
  const route = isCompleted
    ? `/(student)/tests/${test._id}/review`
    : `/(student)/tests/${test._id}/execute`;

  const ctaVariant = getCtaVariant(status);
  const badge = getAttemptBadge(status);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Badge label={test.subjectName} variant="neutral" />
        {badge && <Badge label={badge.label} variant={badge.variant} />}
      </View>

      <Text style={styles.title} numberOfLines={3}>
        {test.name}
      </Text>

      <View style={styles.meta}>
        {(test.availableFrom || test.availableTo) && (
          <Text style={styles.metaText}>
            🕐{" "}
            {test.availableFrom && test.availableTo
              ? `Dal ${formatDate(test.availableFrom)} al ${formatDate(test.availableTo)}`
              : test.availableFrom
                ? `Dal ${formatDate(test.availableFrom)}`
                : `Fino al ${formatDate(test.availableTo)}`}
          </Text>
        )}
        <Text style={styles.metaText}>
          ❓ {questionsCount} domande — {maxScore} pt.
        </Text>
        {test.timeLimit && (
          <Text style={styles.metaText}>⏱ {test.timeLimit} min.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.cta, styles[`cta_${ctaVariant}`]]}
        onPress={() => router.push(route as never)}
        accessibilityRole="button"
        accessibilityLabel={getCtaLabel(status)}
      >
        <Text style={[styles.ctaText, styles[`ctaText_${ctaVariant}`]]}>
          {getCtaLabel(status)}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: "row",
    gap: Spacing[2],
    flexWrap: "wrap",
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.4,
  },
  meta: {
    gap: Spacing[1],
  },
  metaText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  cta: {
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: Spacing[1],
  },
  cta_primary: {
    backgroundColor: Colors.primary,
  },
  cta_warning: {
    backgroundColor: Colors.warning,
  },
  cta_success: {
    backgroundColor: Colors.success,
  },
  ctaText: {
    fontSize: Typography.size.base,
    fontWeight: "600",
  },
  ctaText_primary: {
    color: Colors.white,
  },
  ctaText_warning: {
    color: Colors.white,
  },
  ctaText_success: {
    color: Colors.white,
  },
});
