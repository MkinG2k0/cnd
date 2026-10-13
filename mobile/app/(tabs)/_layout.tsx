import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brass,
        tabBarInactiveTintColor: colors.muted,
        headerTintColor: colors.surface,
        headerStyle: { backgroundColor: colors.forest },
        tabBarStyle: { borderTopColor: colors.line },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'building.2', android: 'apartment', web: 'apartment' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Избранное',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Контакты',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'phone.fill', android: 'phone', web: 'phone' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
