import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/src/theme/tokens";

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Контакты</Text>
      <Text style={styles.subtitle}>Контактная информация появится здесь.</Text>
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
