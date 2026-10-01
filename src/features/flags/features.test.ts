import { describe, expect, it } from 'vitest';
import { DEFAULT_FLAGS, resolveFlags } from './features';

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
