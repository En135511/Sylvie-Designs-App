import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENABLED_FIELDS,
  FIELD_GROUPS,
  GARMENTS,
  MEASUREMENT_FIELDS,
  fieldsForGarment,
} from './garments';
import { resolveEnabledFields } from '../db/repositories/settings';

describe('measurement catalogue', () => {
  const allKeys = MEASUREMENT_FIELDS.map((f) => f.key);

  it('lists every measurement in exactly one group', () => {
    const grouped = FIELD_GROUPS.flatMap((g) => g.keys);
    expect([...grouped].sort()).toEqual([...allKeys].sort());
  });

  it('only references known measurements in garment templates', () => {
    for (const g of GARMENTS) {
      for (const k of g.fields) expect(allKeys).toContain(k);
    }
  });

  it('every measurement appears in at least one garment template', () => {
    const used = new Set(GARMENTS.flatMap((g) => g.fields));
    expect(allKeys.filter((k) => !used.has(k))).toEqual([]);
  });

  it('keeps default measurements valid', () => {
    for (const k of DEFAULT_ENABLED_FIELDS) expect(allKeys).toContain(k);
  });
});

describe('fieldsForGarment', () => {
  it('limits a garment template to the switched-on measurements', () => {
    const keys = fieldsForGarment('skirt', new Set(['waist', 'skirtLength', 'neck'])).map(
      (f) => f.key,
    );
    expect(keys).toEqual(['waist', 'skirtLength']);
  });

  it('shows every switched-on measurement for "Other"', () => {
    const keys = fieldsForGarment('custom', new Set(['calf', 'neck'])).map((f) => f.key);
    expect(keys).toEqual(['neck', 'calf']);
  });

  it('shows nothing when nothing is switched on', () => {
    expect(fieldsForGarment('shirt', new Set())).toEqual([]);
  });
});

describe('resolveEnabledFields', () => {
  it('falls back to the basic set when nothing valid is stored', () => {
    expect([...resolveEnabledFields(undefined)].sort()).toEqual([...DEFAULT_ENABLED_FIELDS].sort());
    expect(resolveEnabledFields('not json').has('neck')).toBe(true);
  });

  it('keeps a stored choice (even empty) and drops unknown keys', () => {
    expect([...resolveEnabledFields('["calf","bogus"]')]).toEqual(['calf']);
    expect(resolveEnabledFields('[]').size).toBe(0);
  });
});
