import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontFamily, spacing } from "../theme/tokens";

type ErrorStateProps = {
  title: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  subtitle,
  retryLabel = "Попробовать снова",
  onRetry,
}: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
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
    color: colors.error,
    fontFamily,
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    borderRadius: 7,
    borderWidth: 1,
    marginTop: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  buttonPressed: {
    backgroundColor: colors.forestHover,
  },
  buttonText: {
    color: colors.surface,
    fontFamily,
    fontSize: 14,
    fontWeight: "500",
  },
});
