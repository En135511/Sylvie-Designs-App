import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, type ColorValue } from 'react-native';
import { Icon, type IconName } from '../../src/components/ui';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { colors } from '../../src/theme';

const tabIcon = (outline: IconName, filled: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name={focused ? filled : outline} size={24} color={color} />;
  };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const showToday = useFlag('today');
  const showOrders = useFlag('orders');
  const showSchools = useFlag('schools');

  return (
    <Tabs
      screenOptions={{
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Explicit height so the 24 px icon and label are never clipped; the bottom inset keeps
        // the bar clear of the gesture area / navigation buttons.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        // Own label so descenders (g, y) are never clipped by the default fixed-height label box.
        tabBarLabel: ({ color, children }) => (
          <Text style={{ color, fontSize: 12, fontWeight: '600', lineHeight: 20 }}>{children}</Text>
        ),
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 24 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Clients', tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: 'Schools',
          tabBarIcon: tabIcon('school-outline', 'school'),
          href: showSchools ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: tabIcon('today-outline', 'today'),
          href: showToday ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: tabIcon('shirt-outline', 'shirt'),
          href: showOrders ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />
    </Tabs>
  );
}
