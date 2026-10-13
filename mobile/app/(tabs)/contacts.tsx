import { useMemo } from "react";
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

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ErrorState } from "@/src/components/ErrorState";
import { phoneHref } from "@/src/lib/format";
import type { SiteSettings } from "@/src/lib/types";
import { whatsappURL } from "@/src/lib/whatsapp";
import { colors, spacing } from "@/src/theme/tokens";

type Channel = {
  key: string;
  label: string;
  value: string;
  onPress: () => void;
};

function hasText(value: string) {
  return value.trim().length > 0;
}

function buildChannels(contacts: SiteSettings["contacts"]): Channel[] {
  const channels: Channel[] = [];

  if (hasText(contacts.phone)) {
    channels.push({
      key: "phone",
      label: "Телефон",
      value: contacts.phone,
      onPress: () => void Linking.openURL(phoneHref(contacts.phone)),
    });
  }

  if (hasText(contacts.whatsapp)) {
    channels.push({
      key: "whatsapp",
      label: "WhatsApp",
      value: contacts.whatsapp,
      onPress: () =>
        void Linking.openURL(
          whatsappURL(contacts.whatsapp, "Добрый день! Хочу связаться с вами."),
        ),
    });
  }

  if (hasText(contacts.telegram)) {
    channels.push({
      key: "telegram",
      label: "Telegram",
      value: contacts.telegram,
      onPress: () => void Linking.openURL(contacts.telegram),
    });
  }

  if (hasText(contacts.email)) {
    channels.push({
      key: "email",
      label: "Email",
      value: contacts.email,
      onPress: () => void Linking.openURL(`mailto:${contacts.email}`),
    });
  }

  if (hasText(contacts.address)) {
    channels.push({
      key: "address",
      label: "Адрес",
      value: contacts.address,
      onPress: () =>
        void Linking.openURL(
          `https://maps.google.com/?q=${encodeURIComponent(contacts.address)}`,
        ),
    });
  }

  if (hasText(contacts.instagram)) {
    channels.push({
      key: "instagram",
      label: "Instagram",
      value: contacts.instagram,
      onPress: () => void Linking.openURL(contacts.instagram),
    });
  }

  return channels;
}

export default function ContactsScreen() {
  const { settings, loading, error, reload } = useSiteSettings();

  const channels = useMemo(
    () => (settings ? buildChannels(settings.contacts) : []),
    [settings],
  );

  const about = settings?.about.filter(hasText) ?? [];
  const founder = settings?.founder;
  const showFounder =
    founder &&
    (hasText(founder.name) ||
      hasText(founder.role) ||
      hasText(founder.bio) ||
      hasText(founder.imageUrl));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text style={styles.statusText}>Загружаем контакты…</Text>
      </View>
    );
  }

  if (error || !settings) {
    return (
      <View style={[styles.centered, styles.fill]}>
        <ErrorState
          title="Не удалось загрузить контакты"
          subtitle="Проверьте подключение к интернету и попробуйте снова."
          onRetry={() => void reload()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Как с нами связаться?</Text>
        <Text style={styles.title}>Свяжитесь с нами</Text>
      </View>

      {channels.length > 0 ? (
        <View style={styles.card}>
          {channels.map((channel, index) => (
            <Pressable
              accessibilityRole="button"
              key={channel.key}
              onPress={channel.onPress}
              style={({ pressed }) => [
                styles.channel,
                index > 0 && styles.channelBorder,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.channelLabel}>{channel.label}</Text>
              <Text style={styles.channelValue}>{channel.value}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {about.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О компании</Text>
          {about.map((paragraph, index) => (
            <Text key={`about-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ) : null}

      {showFounder ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основатель</Text>
          <View style={styles.founderCard}>
            {founder.imageUrl ? (
              <Image
                accessibilityLabel={founder.name || "Основатель"}
                source={{ uri: founder.imageUrl }}
                style={styles.founderImage}
              />
            ) : null}
            <View style={styles.founderText}>
              {hasText(founder.name) ? (
                <Text style={styles.founderName}>{founder.name}</Text>
              ) : null}
              {hasText(founder.role) ? (
                <Text style={styles.founderRole}>{founder.role}</Text>
              ) : null}
              {hasText(founder.bio) ? (
                <Text style={styles.paragraph}>{founder.bio}</Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pale,
    flex: 1,
  },
  fill: {
    flex: 1,
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
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  kicker: {
    color: colors.brass,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  channel: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  channelBorder: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  channelLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  channelValue: {
    color: colors.forest,
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  paragraph: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  founderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  founderImage: {
    borderRadius: 8,
    height: 88,
    width: 88,
  },
  founderText: {
    flex: 1,
    gap: spacing.xs,
  },
  founderName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  founderRole: {
    color: colors.brass,
    fontSize: 14,
    fontWeight: "600",
  },
});
