import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Button } from '../src/components/ui';
import { migrate } from '../src/db/migrations';
import { FeatureFlagsProvider } from '../src/features/flags/FeatureFlagsProvider';
import { colors } from '../src/theme';

const DATABASE_NAME = 'sylvie-designs.db';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/** Shown if the app crashes while starting, e.g. the database could not be opened. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const dbBusy = /createSyncAccessHandle|Access Handle/i.test(error.message);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        gap: 16,
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 16, color: colors.text }}>
        {dbBusy && Platform.OS === 'web'
          ? 'The app is already open in another browser tab or window. Close the other one, then try again.'
          : error.message}
      </Text>
      <Button title="Try again" onPress={retry} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Loading />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate} useSuspense>
        <FeatureFlagsProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
            <Stack.Screen name="client/form" options={{ title: 'Client' }} />
            <Stack.Screen name="measurement/form" options={{ title: 'Measurements' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
            <Stack.Screen name="order/form" options={{ title: 'Order' }} />
            <Stack.Screen name="school/[id]" options={{ title: 'School' }} />
            <Stack.Screen name="school/form" options={{ title: 'School' }} />
            <Stack.Screen name="class/[id]" options={{ title: 'Class' }} />
            <Stack.Screen name="class/add-students" options={{ title: 'Add students' }} />
            <Stack.Screen name="features" options={{ title: 'Feature switches' }} />
          </Stack>
        </FeatureFlagsProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
