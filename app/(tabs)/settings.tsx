import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  textStyles,
} from '../../src/components/ui';
import { saveSetting } from '../../src/db/repositories/settings';
import { exportBackup, pickBackup, restoreBackup } from '../../src/features/backup/backup';
import { useAdvanced, useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { FeatureSwitches } from '../../src/features/flags/FeatureSwitches';
import { WEB_SWITCH } from '../../src/components/Controls';
import { useSettings } from '../../src/hooks/useSettings';
import type { Unit } from '../../src/domain/types';
import { colors, font, spacing } from '../../src/theme';

const UNIT_OPTIONS = [
  { value: 'cm', label: 'Centimetres' },
  { value: 'in', label: 'Inches' },
] as const;

/** Taps on the version line needed to reveal the "Advanced" switch (once, ever). */
const UNLOCK_TAPS = 7;

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const settings = useSettings();
  const [unitChoice, setUnitChoice] = useState<Unit>();
  const [currencyDraft, setCurrencyDraft] = useState<string>();
  const unit = unitChoice ?? settings.unit;
  const currency = currencyDraft ?? settings.currencySymbol;
  const [busy, setBusy] = useState(false);
  const showUnit = useFlag('unitToggle');
  const showPayments = useFlag('payments');
  const showBackup = useFlag('backup');
  const showPicker = useFlag('measurementPicker');
  const advanced = useAdvanced();
  const taps = useRef({ count: 0, last: 0 });

  // Tapping the version quickly 7 times reveals the "Advanced" switch. After that it stays.
  const onVersionTap = () => {
    if (advanced.unlocked) return;
    const now = Date.now();
    taps.current.count = now - taps.current.last < 1500 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= UNLOCK_TAPS) {
      taps.current.count = 0;
      void advanced.unlockAdvanced();
    }
  };

  const chooseUnit = async (next: Unit) => {
    setUnitChoice(next);
    await saveSetting(db, 'unit', next);
  };

  const changeCurrency = (text: string) => {
    setCurrencyDraft(text);
    void saveSetting(db, 'currencySymbol', text);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onExport = () => run(() => exportBackup(db));

  const onRestore = () =>
    run(async () => {
      const backup = await pickBackup();
      if (!backup) return;
      Alert.alert(
        'Replace all data?',
        `This will replace everything in the app with the backup (${backup.clients.length} clients, ${backup.orders.length} orders). This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () =>
              run(async () => {
                await restoreBackup(db, backup);
                Alert.alert('Done', 'Your data has been restored.');
              }),
          },
        ],
      );
    });

  return (
    <Screen>
      {showPicker ? (
        <>
          <SectionHeader title="Measurements" />
          <ListRow
            icon="options"
            title="Choose measurements"
            subtitle="Pick which measurements to show"
            onPress={() => router.push('/measurements-setup')}
          />
        </>
      ) : null}

      {showUnit ? (
        <>
          <SectionHeader title="Measurement unit" />
          <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={chooseUnit} />
          <Text style={textStyles.muted}>
            Measurements are stored precisely, so you can switch any time without losing accuracy.
          </Text>
        </>
      ) : null}

      {showPayments ? (
        <>
          <SectionHeader title="Money" />
          <Field
            label="Currency symbol"
            hint="Shown next to prices, e.g. $ or KSh"
            value={currency}
            onChangeText={changeCurrency}
            maxLength={6}
            autoCapitalize="none"
          />
        </>
      ) : null}

      {showBackup ? (
        <>
          <SectionHeader title="Backup" />
          <Card>
            <Text style={textStyles.body}>
              Your data lives only on this phone. Send yourself a backup regularly (WhatsApp, email
              or Google Drive) so nothing is lost if the phone is lost or reset.
            </Text>
          </Card>
          <Button title="Export backup" icon="share-outline" onPress={onExport} loading={busy} />
          <Button
            title="Restore from backup"
            icon="download-outline"
            variant="secondary"
            onPress={onRestore}
            disabled={busy}
          />
        </>
      ) : null}

      {advanced.unlocked ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Advanced"
          accessibilityState={{ checked: advanced.open }}
          onPress={() => void advanced.setAdvancedOpen(!advanced.open)}
          style={styles.advanced}
        >
          <View pointerEvents="none" aria-hidden>
            <Switch
              value={advanced.open}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
              {...WEB_SWITCH}
            />
          </View>
          <Text style={styles.advancedLabel}>Advanced</Text>
        </Pressable>
      ) : null}

      {advanced.open ? (
        <>
          <SectionHeader title="Feature switches" />
          <FeatureSwitches />
        </>
      ) : null}

      <Pressable accessibilityRole="text" onPress={onVersionTap} style={styles.version} accessible>
        <Text style={styles.versionText}>
          Sylvie Designs · Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  advanced: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 96,
    minHeight: 72,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  advancedLabel: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
  version: { alignItems: 'center', paddingVertical: spacing.xl },
  versionText: { fontSize: font.caption, color: colors.textMuted },
});
