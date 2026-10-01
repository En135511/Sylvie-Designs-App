import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  LoadingView,
  Screen,
  SectionHeader,
  SwitchRow,
  textStyles,
} from '../src/components/ui';
import { getEnabledFields, saveEnabledFields } from '../src/db/repositories/settings';
import {
  DEFAULT_ENABLED_FIELDS,
  FIELD_GROUPS,
  MEASUREMENT_FIELDS,
  fieldLabel,
} from '../src/domain/garments';
import { colors, spacing } from '../src/theme';

/**
 * Lets the tailor choose which measurements appear when she records a client. Turning one off
 * only hides it for new entries: values already saved are kept and still shown on old records.
 */
export default function MeasurementsSetupScreen() {
  const db = useSQLiteContext();
  const [enabled, setEnabled] = useState<ReadonlySet<string> | null>(null);

  useEffect(() => {
    getEnabledFields(db).then(setEnabled);
  }, [db]);

  if (!enabled) {
    return (
      <Screen scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const apply = (next: Set<string>) => {
    setEnabled(next);
    void saveEnabledFields(db, next);
  };

  const toggle = (key: string, on: boolean) => {
    const next = new Set(enabled);
    if (on) next.add(key);
    else next.delete(key);
    apply(next);
  };

  return (
    <Screen>
      <Card style={{ gap: spacing.xs }}>
        <Text style={textStyles.title}>
          {enabled.size} of {MEASUREMENT_FIELDS.length} selected
        </Text>
        <Text style={textStyles.muted}>
          Switch on the measurements you take. Only those appear when you record a client.
          Measurements you have already saved are never deleted.
        </Text>
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Basic set"
            variant="secondary"
            onPress={() => apply(new Set(DEFAULT_ENABLED_FIELDS))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Select all"
            variant="secondary"
            onPress={() => apply(new Set(MEASUREMENT_FIELDS.map((f) => f.key)))}
          />
        </View>
      </View>

      {FIELD_GROUPS.map((group) => (
        <View key={group.title} style={{ gap: spacing.sm }}>
          <SectionHeader title={group.title} />
          <Card style={{ paddingVertical: spacing.xs }}>
            {group.keys.map((key, index) => (
              <View
                key={key}
                style={
                  index > 0
                    ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }
                    : undefined
                }
              >
                <SwitchRow
                  label={fieldLabel(key)}
                  value={enabled.has(key)}
                  onValueChange={(on) => toggle(key, on)}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
