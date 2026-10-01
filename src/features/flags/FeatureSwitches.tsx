import { StyleSheet, View } from 'react-native';
import { Card, SwitchRow } from '../../components/ui';
import { spacing } from '../../theme';
import { FEATURES } from './features';
import { useFlags, useSetFlag } from './FeatureFlagsProvider';

/** One switch per optional feature. Shown inside Settings when "Advanced" is on. */
export function FeatureSwitches() {
  const flags = useFlags();
  const setFlag = useSetFlag();

  return (
    <View style={styles.list}>
      {FEATURES.map((f) => (
        <Card key={f.key} style={styles.card}>
          <SwitchRow
            label={f.label}
            description={f.description}
            value={flags[f.key]}
            onValueChange={(on) => void setFlag(f.key, on)}
          />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: { paddingVertical: spacing.sm },
});
