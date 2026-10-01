import { describe, expect, it } from 'vitest';
import { DEFAULT_FLAGS, resolveAdvanced, resolveFlags } from './features';

describe('feature flags', () => {
  it('uses defaults when nothing is stored', () => {
    expect(resolveFlags({})).toEqual(DEFAULT_FLAGS);
    expect(DEFAULT_FLAGS.orders).toBe(false);
    expect(DEFAULT_FLAGS.backup).toBe(true);
  });

  it('applies stored overrides and ignores unknown or malformed entries', () => {
    const flags = resolveFlags({
      'flag:orders': '1',
      'flag:backup': '0',
      'flag:payments': 'maybe',
      'flag:nonsense': '1',
      unit: 'in',
    });
    expect(flags.orders).toBe(true);
    expect(flags.backup).toBe(false);
    expect(flags.payments).toBe(false);
    expect('nonsense' in flags).toBe(false);
  });
});

describe('advanced switch state', () => {
  it('is locked and closed by default', () => {
    expect(resolveAdvanced({})).toEqual({ unlocked: false, open: false });
  });

  it('can only be open when unlocked', () => {
    expect(resolveAdvanced({ 'flag:advancedOpen': '1' })).toEqual({ unlocked: false, open: false });
    expect(resolveAdvanced({ 'flag:advancedUnlocked': '1' })).toEqual({
      unlocked: true,
      open: false,
    });
    expect(resolveAdvanced({ 'flag:advancedUnlocked': '1', 'flag:advancedOpen': '1' })).toEqual({
      unlocked: true,
      open: true,
    });
  });
});
