import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { money } from "../lib/format";
import type { Product } from "../lib/types";
import { colors, fontFamily, spacing } from "../theme/tokens";
import { FavoriteButton } from "./FavoriteButton";

type ProductCardProps = Pick<
  Product,
  "slug" | "imageUrl" | "name" | "city" | "price" | "description" | "projectPdf"
>;

export function ProductCard({
  slug,
  imageUrl,
  name,
  city,
  price,
  description,
  projectPdf,
}: ProductCardProps) {
  const router = useRouter();

  function openProduct() {
    router.push({ pathname: "/zhk/[slug]", params: { slug } });
  }

  return (
    <View style={styles.card}>
      <View style={styles.media}>
        <Pressable
          accessibilityLabel={`Подробнее: ${name}`}
          accessibilityRole="link"
          onPress={openProduct}
          style={styles.mediaPressable}>
          <Image
            accessibilityLabel={name}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.image}
          />
          <Text style={styles.cityTag}>{city}</Text>
          {projectPdf ? (
            <Text style={styles.docTag}>Есть проект</Text>
          ) : null}
          <View style={styles.imageArrow}>
            <Text style={styles.imageArrowText}>↗</Text>
          </View>
        </Pressable>
        <View style={styles.favorite}>
          <FavoriteButton slug={slug} />
        </View>
      </View>

      <View style={styles.body}>
        <Pressable accessibilityRole="link" onPress={openProduct}>
          <Text numberOfLines={2} style={styles.name}>
            {name}
          </Text>
        </Pressable>
        {description ? (
          <Text numberOfLines={3} style={styles.description}>
            {description}
          </Text>
        ) : null}
        <View style={styles.bottom}>
          <Text style={styles.price}>{money(price)}</Text>
          <Pressable accessibilityRole="link" onPress={openProduct}>
            <Text style={styles.detail}>Подробнее</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
  },
  media: {
    aspectRatio: 1.46,
    backgroundColor: "#dce3db",
    overflow: "hidden",
    width: "100%",
  },
  mediaPressable: {
    ...StyleSheet.absoluteFill,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  cityTag: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 4,
    color: colors.ink,
    fontFamily,
    fontSize: 10,
    left: 16,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 16,
  },
  docTag: {
    backgroundColor: colors.forest,
    borderRadius: 4,
    color: colors.surface,
    fontFamily,
    fontSize: 10,
    left: 16,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 42,
  },
  imageArrow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    bottom: 14,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 32,
  },
  imageArrowText: {
    color: colors.forest,
    fontSize: 18,
    lineHeight: 20,
  },
  favorite: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    zIndex: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  name: {
    color: colors.ink,
    fontFamily,
    fontSize: 24,
    fontWeight: "500",
    letterSpacing: -0.6,
    marginBottom: 13,
  },
  description: {
    color: colors.muted,
    fontFamily,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 19,
  },
  bottom: {
    alignItems: "center",
    borderTopColor: "#e8ece6",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 17,
  },
  price: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: -0.8,
  },
  detail: {
    color: colors.forest,
    fontFamily,
    fontSize: 12,
    paddingVertical: 6,
  },
});
