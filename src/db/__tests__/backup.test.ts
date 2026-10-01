import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from './testDb';
import { collectBackupData, restoreBackup } from '../../features/backup/backup';
import { parseBackup, serializeBackup } from '../../features/backup/format';
import { migrate } from '../migrations';
import { createClient } from '../repositories/clients';
import { createMeasurement } from '../repositories/measurements';
import { createOrder } from '../repositories/orders';
import { addStudents, createClass, createSchool } from '../repositories/schools';
import { saveEnabledFields, saveSetting } from '../repositories/settings';

vi.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));
vi.mock('expo-document-picker', () => ({}));
vi.mock('expo-sharing', () => ({}));
let counter = 0;
vi.mock('../../utils/id', () => ({
  newId: () => `id-${++counter}`,
  nowISO: () => '2026-01-01T00:00:00.000Z',
}));

beforeEach(() => {
  counter = 0;
});

async function populated() {
  const { db, raw } = createTestDb();
  await migrate(db);
  const amina = await createClient(db, { name: 'Amina', phone: '0700', notes: 'loose fit' });
  await createMeasurement(db, {
    clientId: amina,
    garment: 'dress',
    values: { chest: 90.5, 'custom:Cap sleeve': 22 },
    notes: 'tall',
    takenAt: '2026-01-02',
  });
  await createOrder(db, {
    clientId: amina,
    garment: 'dress',
    description: 'blue',
    dueDate: '2026-02-01',
    priceMinor: 12000,
    depositMinor: 5000,
    status: 'sewing',
  });
  const school = await createSchool(db, { name: 'Hill Academy', notes: 'ask for Mrs K' });
  const cls = await createClass(db, school, '4B');
  await addStudents(db, cls, ['Zed', 'Amy']);
  await saveSetting(db, 'unit', 'in');
  await saveSetting(db, 'currencySymbol', 'KSh ');
  return { db, raw };
}

describe('backup round trip', () => {
  it('exports, validates and restores everything into a fresh database', async () => {
    const { db: source } = await populated();
    const json = serializeBackup(await collectBackupData(source));
    const parsed = parseBackup(json);

    const { db: target } = createTestDb();
    await migrate(target);
    await createClient(target, { name: 'Will be replaced', phone: '', notes: '' });
    await restoreBackup(target, parsed);

    expect(await collectBackupData(target)).toEqual(await collectBackupData(source));
  });

  it('keeps feature switches and the chosen measurement list across a restore', async () => {
    const { db: source } = await populated();
    const parsed = parseBackup(serializeBackup(await collectBackupData(source)));

    const { db, raw } = createTestDb();
    await migrate(db);
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('flag:orders', '1')");
    await saveEnabledFields(db, ['calf']);
    await restoreBackup(db, parsed);

    const keys = (raw.prepare('SELECT key FROM settings').all() as { key: string }[]).map(
      (r) => r.key,
    );
    expect(keys).toEqual(
      expect.arrayContaining(['flag:orders', 'measurementFields', 'unit', 'currencySymbol']),
    );
  });

  it('leaves existing data untouched if the restore fails part-way', async () => {
    const { db, raw } = await populated();
    const before = await collectBackupData(db);
    const bad = parseBackup(serializeBackup(before));
    // Two clients with the same id violate the primary key mid-restore.
    bad.clients = [bad.clients[0]!, { ...bad.clients[0]! }];
    await expect(restoreBackup(db, bad)).rejects.toThrow();
    expect(await collectBackupData(db)).toEqual(before);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM clients').get() as { n: number }).n).toBe(3);
  });
});
