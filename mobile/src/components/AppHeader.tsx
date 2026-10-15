import { BlurView } from "expo-blur";
import { type Href, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MENU_ITEMS } from "../theme/nav";
import { colors, fontFamily, spacing } from "../theme/tokens";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  function go(href: string) {
    close();
    router.push(href as Href);
  }

  return (
    <>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(220)}
          pointerEvents="box-none"
          style={[styles.overlay, webBlur]}>
          <BlurView
            intensity={55}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            tint="light"
          />
          <View pointerEvents="none" style={styles.wash} />
          <Pressable
            accessibilityLabel="Закрыть меню"
            accessibilityRole="button"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityLabel="Основная навигация"
            nativeID="navigation"
            pointerEvents="box-none"
            style={[styles.menu, { paddingTop: insets.top + 96 }]}>
            {MENU_ITEMS.map((item, index) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/zhk/")
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Animated.View
                  entering={FadeInDown.delay(80 + index * 70)
                    .duration(420)
                    .springify()
                    .damping(17)}
                  key={item.href}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => go(item.href)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}>
                    <Text
                      style={[
                        styles.menuItemText,
                        active && styles.menuItemActive,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.bar,
          { paddingTop: insets.top + 12 },
          open && styles.barOpen,
        ]}>
        <Pressable
          accessibilityLabel="ЦНД — на главную"
          accessibilityRole="link"
          onPress={() => go("/")}
          style={styles.brand}>
          <Image
            accessibilityIgnoresInvertColors
            source={require("../../assets/images/logo.jpg")}
            style={styles.logo}
          />
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>ЦНД</Text>
            <View style={styles.brandRule}>
              <Text style={styles.brandSub}>
                Центр недвижимости{"\n"}Дагестана
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel={open ? "Закрыть меню" : "Открыть меню"}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={styles.menuToggle}>
          <Text style={styles.menuToggleIcon}>{open ? "×" : "☰"}</Text>
        </Pressable>
      </View>
    </>
  );
}

const webBlur =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(22px) saturate(1.25)",
        WebkitBackdropFilter: "blur(22px) saturate(1.25)",
      } as ViewStyle)
    : null;

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 40,
  },
  wash: {
    backgroundColor: "rgba(243, 245, 242, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  bar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 82,
    paddingBottom: 14,
    paddingHorizontal: spacing.md,
    zIndex: 50,
  },
  barOpen: {
    backgroundColor: "transparent",
  },
  brand: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  logo: {
    height: 47,
    width: 47,
  },
  brandCopy: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  brandTitle: {
    color: colors.forest,
    fontFamily,
    fontSize: 25,
    fontWeight: "600",
    letterSpacing: -1,
  },
  brandRule: {
    borderLeftColor: colors.line,
    borderLeftWidth: 1,
    paddingLeft: 10,
  },
  brandSub: {
    color: colors.ink,
    fontFamily,
    fontSize: 9,
    lineHeight: 13,
  },
  menuToggle: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  menuToggleIcon: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 24,
    textAlign: "center",
  },
  menu: {
    gap: 8,
    paddingHorizontal: 28,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemPressed: {
    opacity: 0.62,
  },
  menuItemText: {
    color: colors.ink,
    fontFamily,
    fontSize: 32,
    fontWeight: "500",
    letterSpacing: -0.8,
  },
  menuItemActive: {
    color: colors.forest,
  },
});
