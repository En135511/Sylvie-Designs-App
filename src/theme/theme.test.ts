import { describe, expect, it } from 'vitest';
import { colors } from './index';

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('colour contrast (WCAG AA = 4.5:1 for text)', () => {
  const pairs: [string, string, string][] = [
    ['text on background', colors.text, colors.background],
    ['text on surface', colors.text, colors.surface],
    ['muted text on background', colors.textMuted, colors.background],
    ['muted text on surface', colors.textMuted, colors.surface],
    ['muted text on muted surface', colors.textMuted, colors.surfaceMuted],
    ['primary on background', colors.primary, colors.background],
    ['primary on surface', colors.primary, colors.surface],
    ['primary on soft primary', colors.primary, colors.primarySoft],
    ['white on primary', colors.primaryText, colors.primary],
    ['white on pressed primary', colors.primaryText, colors.primaryPressed],
    ['danger on surface', colors.danger, colors.surface],
    ['danger on background', colors.danger, colors.background],
    ['danger on soft danger', colors.danger, colors.dangerSoft],
    ['success on soft success', colors.success, colors.successSoft],
    ['warning on soft warning', colors.warning, colors.warningSoft],
    ['muted text on neutral soft', colors.textMuted, colors.neutralSoft],
    ['white on danger', '#FFFFFF', colors.danger],
  ];
  it.each(pairs)('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
