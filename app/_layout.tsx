import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button } from '../src/components/ui';
import { migrate } from '../src/db/migrations';
import { FeatureFlagsProvider } from '../src/features/flags/FeatureFlagsProvider';
import { colors } from '../src/theme';

const DATABASE_NAME = 'sylvie-designs.db';

/** Shown if the app crashes while starting, e.g. the database could not be opened. */
function StartupError({ error, retry }: { error: Error; retry: () => void }) {
  const dbBusy = /createSyncAccessHandle|Access Handle|Invalid VFS state/i.test(error.message);
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
      <Button
        title="Try again"
        onPress={() => (Platform.OS === 'web' ? window.location.reload() : retry())}
      />
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <StartupError error={error} retry={retry} />;
}

const MAX_OPEN_RETRIES = 5;

/** Browsers can hold the previous database connection briefly after a reload. */
const isDatabaseBusy = (e: Error) =>
  /createSyncAccessHandle|Access Handle|Invalid VFS state/i.test(e.message);

/**
 * Opens the database, retrying with a short delay when it is still locked by a previous page
 * load (web only), and shows a clear message if it still cannot be opened.
 */
function DatabaseGate({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [fatal, setFatal] = useState<Error | null>(null);
  const handled = useRef(-1);

  const onError = useCallback(
    (e: Error) => {
      // Called during render, so schedule the state change and only once per attempt.
      if (handled.current === attempt) return;
      handled.current = attempt;
      setTimeout(
        () => {
          if (isDatabaseBusy(e) && attempt < MAX_OPEN_RETRIES) setAttempt((a) => a + 1);
          else setFatal(e);
        },
        300 * (attempt + 1),
      );
    },
    [attempt],
  );

  if (fatal) {
    return (
      <StartupError
        error={fatal}
        retry={() => {
          handled.current = -1;
          setFatal(null);
          setAttempt(0);
        }}
      />
    );
  }

  return (
    <SQLiteProvider key={attempt} databaseName={DATABASE_NAME} onInit={migrate} onError={onError}>
      {children}
    </SQLiteProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseGate>
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
    </DatabaseGate>
  );
}
