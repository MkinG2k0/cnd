import { View } from "react-native";

import { EmptyState } from "@/src/components/EmptyState";
import { colors } from "@/src/theme/tokens";

export default function FavoritesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.pale }}>
      <EmptyState
        title="Пока ничего не добавлено"
        subtitle="Нажмите на сердце у жилого комплекса, чтобы сохранить его."
      />
    </View>
  );
}
