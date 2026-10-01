import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import { saveSetting } from '../../src/db/repositories/settings';
import { exportBackup, pickBackup, restoreBackup } from '../../src/features/backup/backup';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { useSettings } from '../../src/hooks/useSettings';
import type { Unit } from '../../src/domain/types';

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
  const taps = useRef({ count: 0, last: 0 });

  // Tapping the version 7 times in quick succession opens the hidden feature switches.
  const onVersionTap = () => {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 1500 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= 7) {
      taps.current.count = 0;
      router.push('/features');
    }
  };

  const chooseUnit = async (next: Unit) => {
    setUnitChoice(next);
    await saveSetting(db, 'unit', next);
  };

  const saveCurrency = async () => {
    await saveSetting(db, 'currencySymbol', currency);
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
          <Button
            title="Choose which measurements to show"
            variant="secondary"
            onPress={() => router.push('/measurements-setup')}
          />
        </>
      ) : null}

      {showUnit ? (
        <>
          <SectionHeader title="Measurement unit" />
          <ChipRow>
            <Chip label="Centimetres" selected={unit === 'cm'} onPress={() => chooseUnit('cm')} />
            <Chip label="Inches" selected={unit === 'in'} onPress={() => chooseUnit('in')} />
          </ChipRow>
          <Text style={textStyles.muted}>
            Measurements are stored precisely, so you can switch any time without losing accuracy.
          </Text>
        </>
      ) : null}

      {showPayments ? (
        <>
          <SectionHeader title="Currency symbol" />
          <Field
            label="Shown next to prices"
            value={currency}
            onChangeText={setCurrencyDraft}
            onBlur={saveCurrency}
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
          <Button title="Export backup" onPress={onExport} loading={busy} />
          <Button
            title="Restore from backup"
            variant="secondary"
            onPress={onRestore}
            disabled={busy}
          />
        </>
      ) : null}

      <Pressable onPress={onVersionTap} style={{ paddingVertical: 24 }}>
        <Text style={[textStyles.muted, { textAlign: 'center' }]}>
          Sylvie Designs · Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Pressable>
    </Screen>
  );
}
