import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { useCatalogData } from "@/hooks/useCatalogData";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorState } from "@/src/components/ErrorState";
import { HeroSlider } from "@/src/components/HeroSlider";
import { ProductCard } from "@/src/components/ProductCard";
import {
  CITIES,
  filterProducts,
  type CityFilter,
  type SortMode,
} from "@/src/lib/catalog";
import {
  catalogCellWidth,
  catalogNumColumns,
} from "@/src/lib/catalog-layout";
import { colors, fontFamily, spacing } from "@/src/theme/tokens";

const GRID_GAP = 16;

const CITY_TABS: { label: string; value: CityFilter }[] = [
  { label: "Все города", value: "all" },
  ...CITIES.map((city) => ({ label: city, value: city })),
];

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: "По умолчанию", value: "default" },
  { label: "Сначала дешевле", value: "asc" },
  { label: "Сначала дороже", value: "desc" },
];

export default function CatalogScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = catalogNumColumns(width);
  const cellWidth = catalogCellWidth(width, numColumns, {
    gap: GRID_GAP,
    horizontalPadding: spacing.md * 2,
  });
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
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      contentContainerStyle={[
        styles.list,
        filteredProducts.length === 0 && styles.emptyList,
      ]}
      data={filteredProducts}
      key={numColumns}
      keyExtractor={(item) => item.sanityId}
      keyboardShouldPersistTaps="handled"
      numColumns={numColumns}
      ListHeaderComponent={
        <View>
          <HeroSlider products={products} />

          <View style={styles.hero}>
            <View style={styles.location}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                Махачкала, Каспийск, Дербент
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              Недвижимость{"\n"}Дагестана
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/quiz")}
              style={({ pressed }) => [
                styles.heroButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.heroButtonText}>Ответить на вопросы</Text>
              <Text style={styles.heroButtonArrow}>↗</Text>
            </Pressable>
          </View>

          <View style={styles.catalog}>
            <Text style={styles.kicker}>Квартиры в новостройках</Text>
            <View style={styles.headingRow}>
              <Text style={styles.title}>Наши дома</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{products.length}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Выберите город и познакомьтесь с жилыми комплексами поближе.
            </Text>

            <View style={styles.cityTabs}>
              {CITY_TABS.map((tab) => {
                const active = city === tab.value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={tab.value}
                    onPress={() => setCity(tab.value)}
                    style={[styles.cityTab, active && styles.cityTabActive]}>
                    <Text
                      style={[
                        styles.cityTabText,
                        active && styles.cityTabTextActive,
                      ]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.search}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="Поиск по названию или району"
                onChangeText={setQuery}
                placeholder="Название или район"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
            </View>

            <View style={styles.meta}>
              <Text style={styles.metaText}>
                Найдено комплексов: {filteredProducts.length}
              </Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => setSort(option.value)}
                    style={styles.sortOption}>
                    <Text
                      style={[
                        styles.sortText,
                        sort === option.value && styles.sortTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="По вашему запросу ничего не найдено."
          subtitle="Попробуйте другой город или название."
        />
      }
      renderItem={({ item }) => (
        <View style={cellWidth != null ? { width: cellWidth } : undefined}>
          <ProductCard {...item} />
        </View>
      )}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pale,
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.pale,
  },
  statusText: {
    color: colors.muted,
    fontFamily,
    fontSize: 15,
    marginTop: spacing.md,
  },
  list: {
    backgroundColor: colors.pale,
    gap: 18,
    paddingBottom: 48,
    paddingHorizontal: spacing.md,
  },
  row: {
    gap: GRID_GAP,
  },
  emptyList: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    marginTop: spacing.md,
    paddingHorizontal: 26,
    paddingVertical: 30,
  },
  location: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  locationDot: {
    backgroundColor: "#b5c7b0",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  locationText: {
    color: "#d0ded5",
    fontFamily,
    fontSize: 10,
  },
  heroTitle: {
    color: colors.surface,
    fontFamily,
    fontSize: 38,
    fontWeight: "500",
    letterSpacing: -1.8,
    lineHeight: 42,
    marginBottom: 22,
    marginTop: 28,
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 7,
    flexDirection: "row",
    gap: 25,
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  heroButtonText: {
    color: colors.forest,
    fontFamily,
    fontSize: 14,
    fontWeight: "500",
  },
  heroButtonArrow: {
    color: colors.forest,
    fontSize: 21,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.86,
  },
  catalog: {
    paddingTop: 28,
  },
  kicker: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
    marginBottom: 13,
  },
  headingRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: -1.2,
  },
  countBadge: {
    alignItems: "center",
    borderColor: "#cbd4cb",
    borderRadius: 40,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    marginTop: 6,
    minWidth: 40,
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: colors.forest,
    fontFamily,
    fontSize: 14,
  },
  subtitle: {
    color: colors.muted,
    fontFamily,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 16,
  },
  cityTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  cityTab: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cityTabActive: {
    backgroundColor: colors.forest,
  },
  cityTabText: {
    color: colors.ink,
    fontFamily,
    fontSize: 11,
  },
  cityTabTextActive: {
    color: colors.surface,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  searchIcon: {
    color: colors.muted,
    fontSize: 22,
    lineHeight: 24,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 12,
    paddingVertical: 3,
  },
  meta: {
    gap: 10,
    marginBottom: 8,
  },
  metaText: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sortOption: {
    paddingVertical: 4,
  },
  sortText: {
    color: colors.muted,
    fontFamily,
    fontSize: 10,
  },
  sortTextActive: {
    color: colors.ink,
    fontWeight: "600",
  },
});
