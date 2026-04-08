import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, Radius } from "../../constants";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primarySurface, text: Colors.primary },
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger: { bg: Colors.dangerLight, text: Colors.danger },
  neutral: { bg: Colors.gray100, text: Colors.gray600 },
};

export function Badge({ label, variant = "neutral", style }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: Typography.size.xs,
    fontWeight: "600",
  },
});
