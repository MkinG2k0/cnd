import { SymbolView } from "expo-symbols";
import { type GestureResponderEvent, Pressable, StyleSheet } from "react-native";

import { useFavorites } from "../../hooks/useFavorites";
import { colors } from "../theme/tokens";

type FavoriteButtonProps = {
  slug: string;
};

export function FavoriteButton({ slug }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const selected = isFavorite(slug);
  const label = selected ? "Убрать из избранного" : "В избранное";

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    toggle(slug);
  };

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView
        name={{
          ios: selected ? "heart.fill" : "heart",
          android: selected ? "favorite" : "favorite_border",
          web: selected ? "favorite" : "favorite_border",
        }}
        size={24}
        tintColor={selected ? colors.error : colors.forest}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    elevation: 2,
    height: 40,
    justifyContent: "center",
    shadowColor: "#153529",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: 40,
  },
  pressed: {
    opacity: 0.65,
  },
});
