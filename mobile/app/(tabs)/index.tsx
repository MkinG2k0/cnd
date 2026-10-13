import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/theme/tokens';

export default function CatalogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Каталог жилых комплексов</Text>
      <Text style={styles.subtitle}>Список объектов появится здесь.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.pale,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.sm,
  },
});
