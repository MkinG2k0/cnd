import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCatalogData } from "@/hooks/useCatalogData";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorState } from "@/src/components/ErrorState";
import { ProductCard } from "@/src/components/ProductCard";
import {
  CITIES,
  filterProducts,
  type CityFilter,
  type SortMode,
} from "@/src/lib/catalog";
import { colors, spacing } from "@/src/theme/tokens";

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: "По умолчанию", value: "default" },
  { label: "Дешевле", value: "asc" },
  { label: "Дороже", value: "desc" },
];

export default function CatalogScreen() {
  const router = useRouter();
  const { products, loading, error, reload } = useCatalogData();
  const [city, setCity] = useState<CityFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");

  const filteredProducts = useMemo(
    () => filterProducts(products, { city, query, sort }),
    [city, products, query, sort],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text style={styles.statusText}>Загружаем жилые комплексы…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorState
          title="Не удалось загрузить каталог"
          subtitle="Проверьте подключение к интернету и попробуйте снова."
          onRetry={() => void reload()}
        />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        styles.list,
        filteredProducts.length === 0 && styles.emptyList,
      ]}
      data={filteredProducts}
      keyExtractor={(item) => item.sanityId}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>Жилые комплексы</Text>
              <Text style={styles.subtitle}>
                Найдите квартиру в Дагестане
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/quiz")}
              style={({ pressed }) => [
                styles.quizButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.quizButtonText}>Подобрать</Text>
            </Pressable>
          </View>

          <TextInput
            accessibilityLabel="Поиск по каталогу"
            onChangeText={setQuery}
            placeholder="Название или описание"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.search}
            value={query}
          />

          <Text style={styles.controlLabel}>Город</Text>
          <ScrollView
            contentContainerStyle={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {(["all", ...CITIES] as CityFilter[]).map((value) => (
              <Pressable
                accessibilityRole="button"
                key={value}
                onPress={() => setCity(value)}
                style={[
                  styles.chip,
                  city === value && styles.chipSelected,
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    city === value && styles.chipTextSelected,
                  ]}>
                  {value === "all" ? "Все" : value}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.controlLabel}>Сортировка</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => setSort(option.value)}
                style={[
                  styles.sortButton,
                  sort === option.value && styles.sortButtonSelected,
                ]}>
                <Text
                  style={[
                    styles.sortText,
                    sort === option.value && styles.sortTextSelected,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Ничего не найдено"
          subtitle="Измените город или поисковый запрос."
        />
      }
      renderItem={({ item }) => <ProductCard {...item} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.pale,
  },
  statusText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.md,
  },
  list: {
    backgroundColor: colors.pale,
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  quizButton: {
    backgroundColor: colors.forest,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  quizButtonText: {
    color: colors.brass,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  controlLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  chips: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipText: {
    color: colors.ink,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },
  sortRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sortButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  sortButtonSelected: {
    borderColor: colors.forest,
  },
  sortText: {
    color: colors.muted,
    fontSize: 12,
  },
  sortTextSelected: {
    color: colors.forest,
    fontWeight: "700",
  },
});
