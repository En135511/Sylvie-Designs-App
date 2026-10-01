import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from './format';
import type { Client, Measurement, Order } from '../../domain/types';

const client: Client = {
  id: 'c1',
  name: 'Amina',
  phone: '0700',
  notes: '',
  classId: 'k1',
  createdAt: 't',
  updatedAt: 't',
};
const measurement: Measurement = {
  id: 'm1',
  clientId: 'c1',
  garment: 'shirt',
  values: { chest: 96.5 },
  notes: '',
  takenAt: '2026-01-01',
  createdAt: 't',
};
const order: Order = {
  id: 'o1',
  clientId: 'c1',
  garment: 'shirt',
  description: '',
  dueDate: '2026-02-01',
  priceMinor: 5000,
  depositMinor: 1000,
  status: 'sewing',
  createdAt: 't',
  updatedAt: 't',
};
const base = {
  schools: [{ id: 's1', name: 'Hill School', notes: '', createdAt: 't' }],
  classes: [{ id: 'k1', schoolId: 's1', name: 'Class 4B', createdAt: 't' }],
  settings: { unit: 'in' as const, currencySymbol: 'KSh ' },
  clients: [client],
  measurements: [measurement],
  orders: [order],
};

describe('backup format', () => {
  it('round-trips data', () => {
    const parsed = parseBackup(serializeBackup(base));
    expect(parsed.clients).toEqual(base.clients);
    expect(parsed.measurements).toEqual(base.measurements);
    expect(parsed.orders).toEqual(base.orders);
    expect(parsed.settings).toEqual(base.settings);
  });

  it('rejects non-JSON, wrong version and malformed rows', () => {
    expect(() => parseBackup('nope')).toThrow(/valid backup/);
    expect(() => parseBackup(JSON.stringify({ version: 99 }))).toThrow(/unsupported/);
    const bad = JSON.parse(serializeBackup(base));
    bad.orders[0].status = 'bogus';
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/status/);
  });

  it('rejects records pointing at a missing client', () => {
    const bad = JSON.parse(serializeBackup(base));
    bad.orders[0].clientId = 'ghost';
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/missing client/);
  });

  it('rejects a student pointing at a missing class', () => {
    const bad = JSON.parse(serializeBackup(base));
    bad.clients[0].classId = 'ghost';
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/missing class/);
  });

  it('still reads version 1 backups (no schools) and defaults classId to null', () => {
    const v1 = {
      version: 1,
      exportedAt: 't',
      settings: base.settings,
      clients: [{ ...client, classId: undefined }],
      measurements: [measurement],
      orders: [order],
    };
    const parsed = parseBackup(JSON.stringify(v1));
    expect(parsed.schools).toEqual([]);
    expect(parsed.clients[0]?.classId).toBeNull();
  });
});
