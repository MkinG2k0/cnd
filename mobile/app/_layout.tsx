import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { FavoritesProvider } from '@/hooks/useFavorites';
import { colors } from '@/src/theme/tokens';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="zhk/[slug]"
          options={{
            title: 'Жилой комплекс',
            headerTintColor: colors.surface,
            headerStyle: { backgroundColor: colors.forest },
          }}
        />
        <Stack.Screen
          name="quiz"
          options={{
            title: 'Анкета',
            presentation: 'modal',
            headerTintColor: colors.surface,
            headerStyle: { backgroundColor: colors.forest },
          }}
        />
      </Stack>
    </FavoritesProvider>
  );
}
