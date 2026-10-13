import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/src/theme/tokens";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Жилой комплекс</Text>
      <Text style={styles.subtitle}>Карточка объекта «{slug}» появится здесь.</Text>
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
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
