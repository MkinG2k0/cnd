import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AppHeader } from '@/src/components/AppHeader';
import { FavoritesProvider } from '@/hooks/useFavorites';
import { useNotificationObserver } from '@/src/notifications/observer';
import { registerForPushNotificationsAsync } from '@/src/notifications/register';
import {
  createAppQueryClient,
  PERSIST_MAX_AGE,
  queryPersister,
} from '@/src/query/client';
import { colors } from '@/src/theme/tokens';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  useNotificationObserver();
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    void registerForPushNotificationsAsync().then((token) => {
      if (__DEV__ && token) {
        console.log('Expo push token:', token);
      }
    });
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}>
      <FavoritesProvider>
        <StatusBar style="dark" />
        <View style={styles.shell}>
          <AppHeader />
          <View style={styles.body}>
            <Stack screenOptions={{ headerShown: false, contentStyle: styles.screen }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="zhk/[slug]" />
              <Stack.Screen name="quiz" />
            </Stack>
          </View>
        </View>
      </FavoritesProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    flex: 1,
    overflow: "visible",
    position: "relative",
  },
  body: {
    flex: 1,
    zIndex: 0,
  },
  screen: {
    backgroundColor: colors.surface,
  },
});
