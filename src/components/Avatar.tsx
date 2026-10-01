import { StyleSheet, Text, View } from 'react-native';

const PALETTE: readonly { bg: string; fg: string }[] = [
  { bg: '#F4E7EE', fg: '#7A2F55' },
  { bg: '#E4F2EA', fg: '#22603C' },
  { bg: '#E6EEF8', fg: '#2A4F82' },
  { bg: '#FCEFD9', fg: '#7A4800' },
  { bg: '#EFE6F7', fg: '#5B3689' },
  { bg: '#E3F3F2', fg: '#1E6461' },
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Stable colour per name so a client always gets the same avatar. */
export function paletteFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const { bg, fg } = paletteFor(name);
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: size * 0.4 }}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ circle: { alignItems: 'center', justifyContent: 'center' } });
