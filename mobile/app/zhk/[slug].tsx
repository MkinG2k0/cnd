import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import type { Product, SiteSettings } from "@/src/lib/types";
import { whatsappURL } from "@/src/lib/whatsapp";
import { colors, spacing } from "@/src/theme/tokens";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { ready: favoritesReady } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [contacts, setContacts] = useState<SiteSettings["contacts"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const [nextProduct, settings] = await Promise.all([
        fetchProductBySlug(slug),
        fetchSiteSettings(),
      ]);
      setProduct(nextProduct);
      setContacts(settings.contacts);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

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
          onRetry={() => void load()}
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
      <View>
        <Image
          accessibilityLabel={product.name}
          resizeMode="cover"
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
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.city}>{product.city}</Text>
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
          <ActionButton label="WhatsApp" onPress={openWhatsApp} secondary />
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
          label="Подобрать квартиру"
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
    backgroundColor: colors.pale,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.pale,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  statusText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.md,
  },
  image: {
    aspectRatio: 16 / 10,
    backgroundColor: colors.line,
    width: "100%",
  },
  favorite: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
  },
  summary: {
    backgroundColor: colors.surface,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "700",
  },
  city: {
    color: colors.muted,
    fontSize: 15,
  },
  price: {
    color: colors.forest,
    fontSize: 21,
    fontWeight: "700",
  },
  description: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  action: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
  },
  actionText: {
    color: colors.brass,
    fontSize: 16,
    fontWeight: "700",
  },
  actionTextSecondary: {
    color: colors.forest,
  },
  pressed: {
    opacity: 0.78,
  },
});
