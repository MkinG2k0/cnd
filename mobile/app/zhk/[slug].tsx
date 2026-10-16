import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFavorites } from "@/hooks/useFavorites";
import { EmptyState } from "@/src/components/EmptyState";
import { ErrorState } from "@/src/components/ErrorState";
import { FavoriteButton } from "@/src/components/FavoriteButton";
import { money, phoneHref, stripHtml } from "@/src/lib/format";
import {
  fetchProductBySlug,
  fetchSiteSettings,
} from "@/src/lib/map-content";
import { whatsappURL } from "@/src/lib/whatsapp";
import { queryKeys } from "@/src/query/keys";
import { colors, fontFamily, spacing } from "@/src/theme/tokens";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { ready: favoritesReady } = useFavorites();

  const productQuery = useQuery({
    queryKey: queryKeys.product(slug ?? ""),
    queryFn: () => fetchProductBySlug(slug!),
    enabled: Boolean(slug),
  });

  // Settings failure must not hide the product — separate query, contacts optional.
  const settingsQuery = useQuery({
    queryKey: queryKeys.siteSettings,
    queryFn: fetchSiteSettings,
  });

  const product = productQuery.data ?? null;
  const contacts = settingsQuery.data?.contacts ?? null;
  const loading = productQuery.isPending && !productQuery.data;
  const error = Boolean(productQuery.isError && !productQuery.data);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text style={styles.statusText}>Загружаем объект…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorState
          title="Не удалось загрузить объект"
          subtitle="Проверьте подключение к интернету и попробуйте снова."
          onRetry={() => void productQuery.refetch()}
        />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <EmptyState title="Объект не найден" />
      </View>
    );
  }

  const details = stripHtml(product.detailHtml) || product.description;
  const openWhatsApp = () => {
    if (!contacts?.whatsapp) return;
    void Linking.openURL(
      whatsappURL(
        contacts.whatsapp,
        `Добрый день! Интересует ЖК «${product.name}».`,
      ),
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}>
      <View style={styles.crumbs}>
        <Pressable accessibilityRole="link" onPress={() => router.push("/")}>
          <Text style={styles.crumbLink}>Главная</Text>
        </Pressable>
        <Text style={styles.crumbSep}>/</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/")}>
          <Text style={styles.crumbLink}>Наши дома</Text>
        </Pressable>
        <Text style={styles.crumbSep}>/</Text>
        <Text style={styles.crumbCurrent}>{product.name}</Text>
      </View>

      <View>
        <Image
          accessibilityLabel={product.name}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
        {favoritesReady ? (
          <View style={styles.favorite}>
            <FavoriteButton slug={product.slug} />
          </View>
        ) : null}
      </View>

      <View style={styles.summary}>
        <Text style={styles.city}>{product.city}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>{money(product.price)}</Text>
        {details ? <Text style={styles.description}>{details}</Text> : null}
      </View>

      <View style={styles.actions}>
        {contacts?.phone ? (
          <ActionButton
            label="Позвонить"
            onPress={() => void Linking.openURL(phoneHref(contacts.phone))}
          />
        ) : null}
        {contacts?.whatsapp ? (
          <ActionButton label="WhatsApp ↗" onPress={openWhatsApp} secondary />
        ) : null}
        {product.projectPdf ? (
          <ActionButton
            label="Открыть PDF"
            onPress={() =>
              void WebBrowser.openBrowserAsync(product.projectPdf!)
            }
            secondary
          />
        ) : null}
        <ActionButton
          label="Подобрать квартиру ↗"
          onPress={() =>
            router.push({
              pathname: "/quiz",
              params: { productName: product.name },
            })
          }
        />
      </View>
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.actionText,
          secondary && styles.actionTextSecondary,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: spacing.md,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  statusText: {
    color: colors.muted,
    fontFamily,
    fontSize: 15,
    marginTop: spacing.md,
  },
  crumbs: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
    paddingTop: 12,
  },
  crumbLink: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
  },
  crumbSep: {
    color: colors.muted,
    fontSize: 11,
  },
  crumbCurrent: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily,
    fontSize: 11,
  },
  image: {
    aspectRatio: 16 / 11,
    backgroundColor: "#dce3db",
    borderRadius: 12,
    maxHeight: 280,
    width: "100%",
  },
  favorite: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
  },
  summary: {
    paddingTop: 20,
  },
  city: {
    color: colors.muted,
    fontFamily,
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    color: colors.ink,
    fontFamily,
    fontSize: 32,
    fontWeight: "500",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  price: {
    color: colors.ink,
    fontFamily,
    fontSize: 26,
    fontWeight: "500",
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  description: {
    color: "#4f5f57",
    fontFamily,
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 16,
  },
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  action: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    width: "100%",
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderColor: "#bac8bd",
  },
  actionText: {
    color: colors.surface,
    fontFamily,
    fontSize: 14,
    fontWeight: "500",
  },
  actionTextSecondary: {
    color: colors.forest,
  },
  pressed: {
    opacity: 0.86,
  },
});
