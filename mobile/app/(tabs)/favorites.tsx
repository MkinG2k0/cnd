import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useCatalogData } from "@/hooks/useCatalogData";
import { useFavorites } from "@/hooks/useFavorites";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorState } from "@/src/components/ErrorState";
import { ProductCard } from "@/src/components/ProductCard";
import {
  catalogCellWidth,
  catalogNumColumns,
} from "@/src/lib/catalog-layout";
import type { Product } from "@/src/lib/types";
import { colors, fontFamily, spacing } from "@/src/theme/tokens";

const GRID_GAP = 16;

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = catalogNumColumns(width);
  const cellWidth = catalogCellWidth(width, numColumns, {
    gap: GRID_GAP,
    horizontalPadding: spacing.md * 2,
  });
  const { slugs, ready: favoritesReady } = useFavorites();
  const { products, loading, error, reload } = useCatalogData();

  const favoriteProducts = useMemo(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter((product): product is Product => product != null);
  }, [products, slugs]);

  const catalogButton = {
    retryLabel: "Наши дома",
    onRetry: () => router.push("/"),
  };

  if (!favoritesReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text style={styles.statusText}>Загружаем избранное…</Text>
      </View>
    );
  }

  if (slugs.length === 0) {
    return (
      <View style={[styles.centered, styles.fill]}>
        <EmptyState
          title="Пока ничего нет"
          subtitle="Нажмите на сердце у жилого комплекса, чтобы сохранить его."
          {...catalogButton}
        />
      </View>
    );
  }

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
      <View style={[styles.centered, styles.fill]}>
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
        favoriteProducts.length === 0 && styles.emptyList,
      ]}
      data={favoriteProducts}
      key={numColumns}
      keyExtractor={(item) => item.sanityId}
      numColumns={numColumns}
      ListEmptyComponent={
        <EmptyState
          title="Пока ничего нет"
          subtitle="Сохранённые объекты недоступны в каталоге."
          {...catalogButton}
        />
      }
      ListHeaderComponent={
        <View style={styles.heading}>
          <Text style={styles.kicker}>Сохранённые объекты</Text>
          <Text style={styles.title}>Избранное</Text>
        </View>
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
  fill: {
    flex: 1,
    backgroundColor: colors.pale,
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
    padding: spacing.md,
    paddingBottom: 48,
  },
  row: {
    gap: GRID_GAP,
  },
  emptyList: {
    flexGrow: 1,
  },
  heading: {
    gap: 8,
    marginBottom: 8,
  },
  kicker: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
  },
  title: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: -1.2,
  },
});
