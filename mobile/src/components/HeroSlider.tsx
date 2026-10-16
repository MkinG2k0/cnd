import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { Product } from "../lib/types";
import { colors, fontFamily, spacing } from "../theme/tokens";

const AUTO_MS = 4500;

function sliderHeight(windowWidth: number) {
  if (windowWidth >= 1100) return 460;
  if (windowWidth >= 700) return 400;
  return 280;
}

function buildSlides(products: Product[]) {
  const grand = products.find((p) => p.name === "ЖК Грандберег");
  if (!grand) return products;
  return [grand, ...products.filter((p) => p.sanityId !== grand.sanityId)];
}

type HeroSliderProps = {
  products: Product[];
};

export function HeroSlider({ products }: HeroSliderProps) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const slides = useMemo(() => buildSlides(products), [products]);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(Dimensions.get("window").width - 32);
  const height = sliderHeight(windowWidth);

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      const value = ((next % slides.length) + slides.length) % slides.length;
      setIndex(value);
      scrollRef.current?.scrollTo({ x: value * width, animated: true });
    },
    [slides.length, width],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => {
      goTo(index + 1);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [goTo, index, paused, slides.length]);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < slides.length) {
      setIndex(next);
    }
    setPaused(false);
  }

  if (slides.length === 0) return null;

  const active = slides[index] ?? slides[0];

  return (
    <View
      accessibilityLabel="Жилые комплексы"
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next > 0 && Math.abs(next - width) > 1) {
          setWidth(next);
        }
      }}
      style={[styles.wrap, { height }]}>
      <ScrollView
        horizontal
        onMomentumScrollEnd={onScrollEnd}
        onScrollBeginDrag={() => setPaused(true)}
        pagingEnabled
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        style={styles.track}>
        {slides.map((product) => (
          <Pressable
            accessibilityLabel={`Подробнее о ${product.name}`}
            accessibilityRole="link"
            key={product.sanityId}
            onPress={() =>
              router.push({
                pathname: "/zhk/[slug]",
                params: { slug: product.slug },
              })
            }
            style={[styles.slide, { width }]}>
            <Image
              accessibilityLabel={product.name}
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: product.imageUrl }}
              style={styles.image}
            />
          </Pressable>
        ))}
      </ScrollView>

      <LinearGradient
        colors={["transparent", "rgba(12,29,23,0.6)"]}
        locations={[0, 1]}
        pointerEvents="none"
        style={styles.fade}
      />

      <View style={styles.caption}>
        <View style={styles.captionCopy}>
          <Text style={styles.captionKicker}>В нашем каталоге</Text>
          <Text numberOfLines={1} style={styles.captionTitle}>
            {active.name}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Подробнее о ${active.name}`}
          accessibilityRole="link"
          onPress={() =>
            router.push({
              pathname: "/zhk/[slug]",
              params: { slug: active.slug },
            })
          }
          style={styles.open}>
          <Text style={styles.openText}>↗</Text>
        </Pressable>
      </View>

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((product, i) => (
            <Pressable
              accessibilityLabel={`${product.name}, слайд ${i + 1} из ${slides.length}`}
              accessibilityRole="button"
              accessibilityState={{ selected: i === index }}
              key={product.sanityId}
              onPress={() => {
                setPaused(true);
                goTo(i);
                setTimeout(() => setPaused(false), AUTO_MS);
              }}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#9ba9a2",
    borderRadius: 12,
    marginTop: spacing.md,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  track: {
    flex: 1,
  },
  slide: {
    height: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fade: {
    bottom: 0,
    height: "45%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  caption: {
    alignItems: "center",
    bottom: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 23,
    position: "absolute",
    right: 23,
  },
  captionCopy: {
    flex: 1,
    marginRight: spacing.sm,
  },
  captionKicker: {
    color: "#f0f4ed",
    fontFamily,
    fontSize: 11,
    marginBottom: 6,
  },
  captionTitle: {
    color: colors.surface,
    fontFamily,
    fontSize: 21,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
  open: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  openText: {
    color: colors.forest,
    fontSize: 25,
    lineHeight: 28,
  },
  dots: {
    alignItems: "center",
    bottom: 14,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  dotActive: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    width: 18,
  },
});
