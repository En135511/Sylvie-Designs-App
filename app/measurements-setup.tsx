import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, Card, Screen, SectionHeader, textStyles } from '../src/components/ui';
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
      <Screen>
        <Text style={textStyles.muted}>Loading…</Text>
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
      <Text style={textStyles.muted}>
        Switch on the measurements you take. Only those will appear when you record a client.
        Measurements you have already saved are never deleted.
      </Text>
      <Text style={textStyles.body}>
        {enabled.size} of {MEASUREMENT_FIELDS.length} selected
      </Text>
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
          {group.keys.map((key) => (
            <Card key={key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={[textStyles.body, { flex: 1 }]}>{fieldLabel(key)}</Text>
                <Switch
                  accessibilityLabel={fieldLabel(key)}
                  value={enabled.has(key)}
                  onValueChange={(on) => toggle(key, on)}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
