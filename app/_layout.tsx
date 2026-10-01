import { Stack, router, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button, Icon, IconButton } from '../src/components/ui';
import { migrate } from '../src/db/migrations';
import { FeatureFlagsProvider } from '../src/features/flags/FeatureFlagsProvider';
import { colors } from '../src/theme';

const DATABASE_NAME = 'sylvie-designs.db';

// Keep the splash screen up until the database is open, so there is no blank flash.
void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Hides the splash screen as soon as it renders (the database is ready by then). */
function HideSplash() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  return null;
}

/** Shown if the app crashes while starting, e.g. the database could not be opened. */
function StartupError({ error, retry }: { error: Error; retry: () => void }) {
  const dbBusy = /createSyncAccessHandle|Access Handle|Invalid VFS state/i.test(error.message);
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 14,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.dangerSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="alert-circle-outline" size={36} color={colors.danger} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
        {dbBusy && Platform.OS === 'web'
          ? 'The app is already open in another browser tab or window. Close the other one, then try again.'
          : error.message}
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
        <Button
          title="Try again"
          onPress={() => (Platform.OS === 'web' ? window.location.reload() : retry())}
        />
      </View>
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
      <HideSplash />
      {children}
    </SQLiteProvider>
  );
}

/**
 * On the web preview, show the app as a centred phone-sized column instead of stretching it
 * across a wide browser window. On Android this is a plain full-size container.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#E4DCD8' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 480,
          backgroundColor: colors.background,
          overflow: 'hidden',
          boxShadow: '0px 0px 40px rgba(36, 29, 27, 0.18)',
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <PhoneFrame>
      <DatabaseGate>
        <FeatureFlagsProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: 18 },
              headerBackVisible: false,
              // Custom back button: a full 48 px touch target on every platform.
              headerLeft: ({ canGoBack }) =>
                canGoBack ? (
                  <IconButton
                    icon="chevron-back"
                    label="Go back"
                    tone="plain"
                    onPress={() => router.back()}
                  />
                ) : null,
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
            <Stack.Screen name="measurements-setup" options={{ title: 'Choose measurements' }} />
          </Stack>
        </FeatureFlagsProvider>
      </DatabaseGate>
    </PhoneFrame>
  );
}
