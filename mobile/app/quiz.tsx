import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/src/theme/tokens";

export default function QuizScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Подбор жилого комплекса</Text>
      <Text style={styles.subtitle}>Анкета будет добавлена на следующем этапе.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.pale,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
