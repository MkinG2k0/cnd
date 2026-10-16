import { Image } from "expo-image";
import { useMemo } from "react";
import {
  ActivityIndicator,
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
import { colors, fontFamily, spacing } from "@/src/theme/tokens";

type Social = {
  key: string;
  label: string;
  onPress: () => void;
};

function hasText(value: string) {
  return value.trim().length > 0;
}

function buildSocials(contacts: SiteSettings["contacts"]): Social[] {
  const socials: Social[] = [];

  if (hasText(contacts.whatsapp)) {
    socials.push({
      key: "whatsapp",
      label: "WhatsApp",
      onPress: () =>
        void Linking.openURL(
          whatsappURL(contacts.whatsapp, "Добрый день! Хочу связаться с вами."),
        ),
    });
  }

  if (hasText(contacts.telegram)) {
    socials.push({
      key: "telegram",
      label: "Telegram",
      onPress: () => void Linking.openURL(contacts.telegram),
    });
  }

  if (hasText(contacts.instagram)) {
    socials.push({
      key: "instagram",
      label: "Instagram",
      onPress: () => void Linking.openURL(contacts.instagram),
    });
  }

  return socials;
}

export default function ContactsScreen() {
  const { settings, loading, error, reload } = useSiteSettings();
  const socials = useMemo(
    () => (settings ? buildSocials(settings.contacts) : []),
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

  const { contacts } = settings;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroKicker}>Как с нами связаться?</Text>
          <Text style={styles.heroTitle}>
            Свяжитесь с нами{"\n"}без промедления
          </Text>
          {hasText(contacts.phone) ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(phoneHref(contacts.phone))}>
              <Text style={styles.phone}>{contacts.phone}</Text>
            </Pressable>
          ) : null}
          {hasText(contacts.email) ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`mailto:${contacts.email}`)}>
              <Text style={styles.email}>{contacts.email}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.office}>
          <Text style={styles.officeKicker}>
            Будем рады видеть вас в офисе
          </Text>
          <Text style={styles.officeAddress}>
            {hasText(contacts.address)
              ? contacts.address
              : "г. Махачкала\n5-я линия Акушинского 25"}
          </Text>
          {socials.length > 0 ? (
            <View style={styles.socials}>
              {socials.map((social) => (
                <Pressable
                  accessibilityRole="link"
                  key={social.key}
                  onPress={social.onPress}
                  style={({ pressed }) => [
                    styles.social,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.socialText}>{social.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {about.length > 0 ? (
        <View style={styles.about}>
          <Text style={styles.kicker}>Центр недвижимости Дагестана</Text>
          <Text style={styles.sectionTitle}>Кто мы?</Text>
          {about.map((paragraph, index) => (
            <Text
              key={`about-${index}`}
              style={[
                styles.paragraph,
                index === 0 && styles.aboutLead,
              ]}>
              {paragraph}
            </Text>
          ))}
        </View>
      ) : null}

      {showFounder ? (
        <View style={styles.founder}>
          {founder.imageUrl ? (
            <Image
              accessibilityLabel={founder.name || "Основатель"}
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: founder.imageUrl }}
              style={styles.founderImage}
            />
          ) : null}
          <View style={styles.founderCopy}>
            {hasText(founder.role) ? (
              <Text style={styles.kicker}>{founder.role}</Text>
            ) : null}
            {hasText(founder.name) ? (
              <Text style={styles.founderName}>{founder.name}</Text>
            ) : null}
            {hasText(founder.bio) ? (
              <Text style={styles.founderBio}>{founder.bio}</Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  fill: {
    flex: 1,
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
  content: {
    gap: 32,
    padding: spacing.md,
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: colors.forest,
    borderRadius: 12,
    gap: 30,
    paddingHorizontal: 26,
    paddingVertical: 36,
  },
  heroKicker: {
    color: "#c1d0c6",
    fontFamily,
    fontSize: 11,
    marginBottom: 13,
  },
  heroTitle: {
    color: colors.surface,
    fontFamily,
    fontSize: 31,
    fontWeight: "500",
    letterSpacing: -1,
    lineHeight: 36,
  },
  phone: {
    color: colors.surface,
    fontFamily,
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginTop: 28,
  },
  email: {
    color: "#d4dfd8",
    fontFamily,
    fontSize: 12,
    marginTop: 9,
  },
  office: {
    borderTopColor: "#577262",
    borderTopWidth: 1,
    paddingTop: 24,
  },
  officeKicker: {
    color: "#c1d0c6",
    fontFamily,
    fontSize: 12,
    marginBottom: 16,
  },
  officeAddress: {
    color: colors.surface,
    fontFamily,
    fontSize: 21,
    fontWeight: "500",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  socials: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 22,
  },
  social: {
    borderColor: "#708477",
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  socialText: {
    color: colors.surface,
    fontFamily,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  about: {
    gap: 12,
    paddingTop: 8,
  },
  kicker: {
    color: colors.muted,
    fontFamily,
    fontSize: 11,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  aboutLead: {
    color: colors.ink,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  paragraph: {
    color: colors.muted,
    fontFamily,
    fontSize: 14,
    lineHeight: 25,
  },
  founder: {
    backgroundColor: colors.founderBg,
    borderRadius: 10,
    overflow: "hidden",
  },
  founderImage: {
    height: 300,
    width: "100%",
  },
  founderCopy: {
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 28,
  },
  founderName: {
    color: colors.ink,
    fontFamily,
    fontSize: 32,
    fontWeight: "500",
    letterSpacing: -1,
  },
  founderBio: {
    color: "#56665d",
    fontFamily,
    fontSize: 14,
    lineHeight: 25,
  },
});
