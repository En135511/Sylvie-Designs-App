import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../theme';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

/** Tappable row: avatar or icon, title, optional subtitle, optional trailing node, chevron. */
export function ListRow({
  title,
  subtitle,
  onPress,
  avatarName,
  icon,
  trailing,
  chevron = true,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  avatarName?: string;
  icon?: IconName;
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
      <View style={styles.row}>
        {avatarName !== undefined ? (
          <Avatar name={avatarName} />
        ) : icon ? (
          <View style={styles.iconCircle}>
            <Icon name={icon} size={22} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing}
        {chevron ? <Icon name="chevron-forward" size={20} color={colors.textMuted} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: font.small, color: colors.textMuted },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
