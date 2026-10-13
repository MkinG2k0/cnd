import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCatalogData } from "@/hooks/useCatalogData";
import { useFavorites } from "@/hooks/useFavorites";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorState } from "@/src/components/ErrorState";
import { ProductCard } from "@/src/components/ProductCard";
import type { Product } from "@/src/lib/types";
import { colors, spacing } from "@/src/theme/tokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const { slugs, ready: favoritesReady } = useFavorites();
  const { products, loading, error, reload } = useCatalogData();

  const favoriteProducts = useMemo(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter((product): product is Product => product != null);
  }, [products, slugs]);

  const catalogButton = {
    retryLabel: "В каталог",
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
      contentContainerStyle={[
        styles.list,
        favoriteProducts.length === 0 && styles.emptyList,
      ]}
      data={favoriteProducts}
      keyExtractor={(item) => item.sanityId}
      ListEmptyComponent={
        <EmptyState
          title="Пока ничего нет"
          subtitle="Сохранённые объекты недоступны в каталоге."
          {...catalogButton}
        />
      }
      renderItem={({ item }) => <ProductCard {...item} />}
    />
  );
}

const styles = StyleSheet.create({
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
});
