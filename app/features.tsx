import { Switch, Text, View } from 'react-native';
import { Card, Screen, textStyles } from '../src/components/ui';
import { FEATURES } from '../src/features/flags/features';
import { useFlags, useSetFlag } from '../src/features/flags/FeatureFlagsProvider';
import { colors, spacing } from '../src/theme';

/** Hidden screen (unlocked from Settings) for turning optional features on and off. */
export default function FeaturesScreen() {
  const flags = useFlags();
  const setFlag = useSetFlag();

  return (
    <Screen>
      <Text style={textStyles.muted}>
        Switch features on or off. Changes apply immediately and no data is ever deleted, so a
        feature you turn off keeps its information for when you turn it back on.
      </Text>
      {FEATURES.map((f) => (
        <Card key={f.key}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={textStyles.title}>{f.label}</Text>
              <Text style={textStyles.muted}>{f.description}</Text>
            </View>
            <Switch
              accessibilityLabel={f.label}
              value={flags[f.key]}
              onValueChange={(on) => setFlag(f.key, on)}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
