import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function EmptyState({
  title,
  subtitle,
  retryLabel = "Повторить",
  onRetry,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.forest,
    borderRadius: 8,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  buttonPressed: {
    backgroundColor: colors.forestHover,
  },
  buttonText: {
    color: colors.brass,
    fontSize: 15,
    fontWeight: "700",
  },
});
