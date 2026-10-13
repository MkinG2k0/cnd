import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { money } from "../lib/format";
import type { Product } from "../lib/types";
import { colors, spacing } from "../theme/tokens";
import { FavoriteButton } from "./FavoriteButton";

type ProductCardProps = Pick<
  Product,
  "slug" | "imageUrl" | "name" | "city" | "price"
>;

export function ProductCard({
  slug,
  imageUrl,
  name,
  city,
  price,
}: ProductCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`${name}, ${city}, ${money(price)}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/zhk/[slug]", params: { slug } })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        <Image
          accessibilityLabel={name}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={styles.image}
        />
        <View style={styles.favorite}>
          <FavoriteButton slug={slug} />
        </View>
      </View>
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>
          {name}
        </Text>
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.price}>{money(price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.82,
  },
  image: {
    aspectRatio: 16 / 10,
    backgroundColor: colors.pale,
    width: "100%",
  },
  favorite: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
  },
  content: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  city: {
    color: colors.muted,
    fontSize: 14,
  },
  price: {
    color: colors.forest,
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
});
