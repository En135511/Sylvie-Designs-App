import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { DateField } from '../../src/components/DateField';
import {
  Button,
  Chip,
  ChipRow,
  Field,
  Screen,
  SectionHeader,
  textStyles,
} from '../../src/components/ui';
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  latestMeasurement,
  updateMeasurement,
} from '../../src/db/repositories/measurements';
import { getClient } from '../../src/db/repositories/clients';
import { nextUnmeasuredStudent } from '../../src/db/repositories/schools';
import { getEnabledFields, getSettings } from '../../src/db/repositories/settings';
import { GARMENTS, customKey, fieldLabel, fieldsForGarment } from '../../src/domain/garments';
import type { MeasurementValues, Unit } from '../../src/domain/types';
import { useFlag } from '../../src/features/flags/FeatureFlagsProvider';
import { todayISO } from '../../src/utils/dates';
import { cmToDisplay, parseNumber, toCm } from '../../src/utils/units';

const toInputs = (values: MeasurementValues, unit: Unit): Record<string, string> =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(cmToDisplay(v, unit))]));

export default function MeasurementFormScreen() {
  const db = useSQLiteContext();
  const {
    clientId,
    id,
    classId,
    garment: garmentParam,
  } = useLocalSearchParams<{
    clientId: string;
    id?: string;
    /** Set when measuring a school class: enables "Save & next student". */
    classId?: string;
    garment?: string;
  }>();

  const [enabledFields, setEnabledFields] = useState<ReadonlySet<string>>(new Set());
  const allowCustom = useFlag('customMeasurements');
  const [ready, setReady] = useState(false);
  const [unit, setUnit] = useState<Unit>('cm');
  const [garment, setGarment] = useState(garmentParam ?? 'shirt');
  const [studentName, setStudentName] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [takenAt, setTakenAt] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customKeys, setCustomKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load unit + (when editing) the existing record.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettings(db);
      const enabled = await getEnabledFields(db);
      const existing = id ? await getMeasurement(db, id) : null;
      const client = classId ? await getClient(db, clientId) : null;
      if (cancelled) return;
      setStudentName(client?.name ?? '');
      setUnit(settings.unit);
      setEnabledFields(enabled);
      if (existing) {
        setGarment(existing.garment);
        setInputs(toInputs(existing.values, settings.unit));
        setTakenAt(existing.takenAt);
        setNotes(existing.notes);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, id, classId, clientId]);

  // New record: offer the client's previous numbers for the chosen garment as a starting point.
  useEffect(() => {
    if (!ready || id) return;
    let cancelled = false;
    latestMeasurement(db, clientId, garment).then((prev) => {
      if (cancelled) return;
      setPrefilled(!!prev);
      setInputs(prev ? toInputs(prev.values, unit) : {});
    });
    return () => {
      cancelled = true;
    };
  }, [db, clientId, garment, ready, id, unit]);

  const fields = useMemo(() => {
    const base = fieldsForGarment(garment, enabledFields);
    const known = new Set(base.map((f) => f.key));
    const extraKeys = new Set([
      ...Object.keys(inputs).filter((k) => !known.has(k) && inputs[k]?.trim()),
      ...customKeys,
    ]);
    const extras = [...extraKeys].map((k) => ({ key: k, label: fieldLabel(k) }));
    return [...base, ...extras];
  }, [garment, enabledFields, inputs, customKeys]);

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const key = customKey(name);
    setCustomKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setCustomName('');
  };

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    const values: MeasurementValues = {};
    for (const [key, raw] of Object.entries(inputs)) {
      if (!raw.trim()) continue;
      const n = parseNumber(raw);
      if (n === null || n <= 0 || n > 1000) nextErrors[key] = 'Enter a valid number';
      else values[key] = toCm(n, unit);
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (Object.keys(values).length === 0) {
      setFormError('Enter at least one measurement');
      return;
    }
    setSaving(true);
    try {
      if (id) await updateMeasurement(db, id, { garment, values, notes, takenAt });
      else await createMeasurement(db, { clientId, garment, values, notes, takenAt });

      const next =
        classId && !id ? await nextUnmeasuredStudent(db, classId, garment, clientId) : null;
      if (next) {
        router.replace({
          pathname: '/measurement/form',
          params: { clientId: next.id, classId, garment },
        });
        return;
      }
      if (classId && !id) Alert.alert('All done', 'Every student in this class has been measured.');
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete these measurements?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await deleteMeasurement(db, id);
          router.back();
        },
      },
    ]);

  if (!ready)
    return (
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
      </Screen>
    );

  return (
    <Screen>
      <Stack.Screen
        options={{ title: studentName || (id ? 'Edit measurements' : 'New measurements') }}
      />
      {classId ? null : (
        <>
          <SectionHeader title="Garment" />
          <ChipRow>
            {GARMENTS.map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                selected={garment === g.key}
                onPress={() => setGarment(g.key)}
              />
            ))}
          </ChipRow>
        </>
      )}

      <DateField label="Date taken" value={takenAt} onChange={setTakenAt} />

      <SectionHeader title={`Measurements (${unit})`} />
      {prefilled && !id ? (
        <Text style={textStyles.muted}>
          Pre-filled from the last time. Update what has changed.
        </Text>
      ) : null}
      {fields.length === 0 ? (
        <Text style={textStyles.muted}>
          No measurements are switched on. Turn some on in Settings, Choose measurements.
        </Text>
      ) : null}
      {fields.map((f) => (
        <Field
          key={f.key}
          label={f.label}
          value={inputs[f.key] ?? ''}
          onChangeText={(t) => {
            setInputs((prev) => ({ ...prev, [f.key]: t }));
            setErrors((prev) => ({ ...prev, [f.key]: '' }));
            setFormError(undefined);
          }}
          keyboardType="decimal-pad"
          error={errors[f.key] || undefined}
          placeholder={unit}
        />
      ))}
      {allowCustom ? (
        <>
          <Field
            label="Add your own measurement"
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. Cap sleeve, Kaftan length"
            onSubmitEditing={addCustom}
          />
          <Button
            title="＋ Add measurement"
            variant="secondary"
            onPress={addCustom}
            disabled={!customName.trim()}
          />
        </>
      ) : null}
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Posture, fit preferences…"
      />
      {formError ? <Text style={{ color: '#B3261E' }}>{formError}</Text> : null}
      <Button
        title={classId && !id ? 'Save & next student' : 'Save'}
        onPress={save}
        loading={saving}
      />
      {id ? <Button title="Delete" variant="danger" onPress={confirmDelete} /> : null}
    </Screen>
  );
}
