import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { colors } from '../../src/theme';

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const showToday = useFlag('today');
  const showOrders = useFlag('orders');
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, minHeight: 60 },
        tabBarLabelStyle: { fontSize: 13 },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Clients', tabBarIcon: icon('👤') }} />
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: icon('📋'), href: showToday ? undefined : null }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: icon('🧵'), href: showOrders ? undefined : null }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
