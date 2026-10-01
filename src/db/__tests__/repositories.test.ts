import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MIGRATIONS, migrate } from '../migrations';
import { createClient, deleteClient, getClient, listClients } from '../repositories/clients';
import {
  createMeasurement,
  latestMeasurement,
  listMeasurements,
} from '../repositories/measurements';
import { createOrder, listActiveOrders, setOrderStatus } from '../repositories/orders';
import {
  addStudents,
  createClass,
  createSchool,
  deleteClass,
  deleteSchool,
  listClassSheet,
  listClassesForSchool,
  listSchools,
  listStudents,
  nextUnmeasuredStudent,
} from '../repositories/schools';
import {
  getEnabledFields,
  getSettings,
  saveEnabledFields,
  saveSetting,
} from '../repositories/settings';
import { createTestDb } from './testDb';

let counter = 0;
vi.mock('../../utils/id', () => ({
  newId: () => `id-${++counter}`,
  nowISO: () => '2026-01-01T00:00:00.000Z',
}));

let db: ReturnType<typeof createTestDb>['db'];
let raw: ReturnType<typeof createTestDb>['raw'];

beforeEach(async () => {
  counter = 0;
  ({ db, raw } = createTestDb());
  await migrate(db);
});

const measurement = (clientId: string, garment = 'shirt', takenAt = '2026-01-01') => ({
  clientId,
  garment,
  values: { chest: 90, waist: 70 },
  notes: 'note',
  takenAt,
});

describe('migrations', () => {
  it('create the full schema on a fresh database', async () => {
    const tables = raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((r: unknown) => (r as { name: string }).name);
    expect(tables).toEqual(
      expect.arrayContaining([
        'clients',
        'measurements',
        'orders',
        'schools',
        'classes',
        'settings',
      ]),
    );
    expect(
      (raw.prepare('PRAGMA user_version').get() as { user_version: number }).user_version,
    ).toBe(MIGRATIONS.length);
  });

  it('upgrade an existing v1 database without losing data', async () => {
    const { db: old, raw: oldRaw } = createTestDb();
    oldRaw.exec(MIGRATIONS[0]!);
    oldRaw.exec('PRAGMA user_version = 1');
    oldRaw.exec(
      `INSERT INTO clients (id,name,phone,notes,created_at,updated_at) VALUES ('c1','Old Client','','','t','t')`,
    );
    oldRaw.exec(
      `INSERT INTO measurements (id,client_id,garment,values_json,notes,taken_at,created_at) VALUES ('m1','c1','shirt','{"chest":90}','','2026-01-01','t')`,
    );

    await migrate(old);

    const client = await getClient(old, 'c1');
    expect(client?.name).toBe('Old Client');
    expect(client?.classId).toBeNull();
    expect((await listMeasurements(old, 'c1'))[0]?.values).toEqual({ chest: 90 });
    expect(await listSchools(old)).toEqual([]);
  });

  it('are idempotent', async () => {
    await migrate(db);
    await migrate(db);
    expect(
      (raw.prepare('PRAGMA user_version').get() as { user_version: number }).user_version,
    ).toBe(MIGRATIONS.length);
  });
});

describe('clients', () => {
  it('searches by name or phone, escapes wildcards, and sorts case-insensitively', async () => {
    await createClient(db, { name: 'bella', phone: '0700', notes: '' });
    await createClient(db, { name: 'Amina', phone: '0711 222', notes: '' });
    await createClient(db, { name: '100% Tailor', phone: '', notes: '' });
    expect((await listClients(db)).map((c) => c.name)).toEqual(['100% Tailor', 'Amina', 'bella']);
    expect((await listClients(db, '0711')).map((c) => c.name)).toEqual(['Amina']);
    expect((await listClients(db, '%')).map((c) => c.name)).toEqual(['100% Tailor']);
    expect(await listClients(db, '_')).toEqual([]);
  });

  it('delete cascades to measurements and orders', async () => {
    const id = await createClient(db, { name: 'Amina', phone: '', notes: '' });
    await createMeasurement(db, measurement(id));
    await createOrder(db, {
      clientId: id,
      garment: 'shirt',
      description: '',
      dueDate: '2026-02-01',
      priceMinor: 100,
      depositMinor: 0,
      status: 'new',
    });
    await deleteClient(db, id);
    expect(await listMeasurements(db, id)).toEqual([]);
    expect(await listActiveOrders(db)).toEqual([]);
  });
});

describe('measurements and orders', () => {
  it('returns the latest measurement per garment', async () => {
    const id = await createClient(db, { name: 'Amina', phone: '', notes: '' });
    await createMeasurement(db, {
      ...measurement(id),
      takenAt: '2026-01-01',
      values: { chest: 90 },
    });
    await createMeasurement(db, {
      ...measurement(id),
      takenAt: '2026-03-01',
      values: { chest: 92 },
    });
    await createMeasurement(db, { ...measurement(id, 'dress'), values: { chest: 50 } });
    expect((await latestMeasurement(db, id, 'shirt'))?.values.chest).toBe(92);
    expect((await latestMeasurement(db, id, 'dress'))?.values.chest).toBe(50);
    expect(await latestMeasurement(db, id, 'skirt')).toBeNull();
  });

  it('lists active orders soonest first and hides delivered ones', async () => {
    const id = await createClient(db, { name: 'Amina', phone: '', notes: '' });
    const base = {
      clientId: id,
      garment: 'shirt',
      description: '',
      priceMinor: 0,
      depositMinor: 0,
      status: 'new' as const,
    };
    const late = await createOrder(db, { ...base, dueDate: '2026-05-01' });
    await createOrder(db, { ...base, dueDate: '2026-02-01' });
    expect((await listActiveOrders(db)).map((o) => o.dueDate)).toEqual([
      '2026-02-01',
      '2026-05-01',
    ]);
    await setOrderStatus(db, late, 'delivered');
    expect((await listActiveOrders(db)).map((o) => o.dueDate)).toEqual(['2026-02-01']);
  });
});

describe('schools, classes and students', () => {
  async function setup() {
    const school = await createSchool(db, { name: 'Hill Academy', notes: '' });
    const cls = await createClass(db, school, '4B');
    await addStudents(db, cls, ['Zed', 'amy', 'Bob']);
    return { school, cls };
  }

  it('counts classes and students per school and class', async () => {
    const { school, cls } = await setup();
    expect((await listSchools(db))[0]).toMatchObject({
      name: 'Hill Academy',
      classCount: 1,
      studentCount: 3,
    });
    expect((await listClassesForSchool(db, school))[0]).toMatchObject({ id: cls, studentCount: 3 });
  });

  it('lists students alphabetically with their measured state per garment', async () => {
    const { cls } = await setup();
    const students = await listStudents(db, cls, 'shirt');
    expect(students.map((s) => s.name)).toEqual(['amy', 'Bob', 'Zed']);
    expect(students.every((s) => s.measurementId === null)).toBe(true);

    await createMeasurement(db, measurement(students[1]!.id, 'shirt'));
    const after = await listStudents(db, cls, 'shirt');
    expect(after.map((s) => s.measurementId !== null)).toEqual([false, true, false]);
    // A different garment is tracked separately.
    expect((await listStudents(db, cls, 'dress')).every((s) => s.measurementId === null)).toBe(
      true,
    );
  });

  it('walks through unmeasured students in order, wrapping round, then reports done', async () => {
    const { cls } = await setup();
    const [amy, bob, zed] = await listStudents(db, cls, 'shirt');
    // Nothing measured: first student comes first.
    expect((await nextUnmeasuredStudent(db, cls, 'shirt', ''))?.name).toBe('amy');
    await createMeasurement(db, measurement(amy!.id));
    expect((await nextUnmeasuredStudent(db, cls, 'shirt', amy!.id))?.name).toBe('Bob');
    await createMeasurement(db, measurement(zed!.id));
    // From Bob (the last unmeasured), nothing else is left.
    expect(await nextUnmeasuredStudent(db, cls, 'shirt', bob!.id)).toBeNull();
    // From Zed, wraps around to Bob.
    expect((await nextUnmeasuredStudent(db, cls, 'shirt', zed!.id))?.name).toBe('Bob');
  });

  it('hides students from the main client list but finds them by search', async () => {
    await setup();
    await createClient(db, { name: 'Walk-in', phone: '', notes: '' });
    expect((await listClients(db, '', true)).map((c) => c.name)).toEqual(['Walk-in']);
    expect((await listClients(db, 'amy', true)).map((c) => c.name)).toEqual(['amy']);
    expect((await listClients(db, '', false)).length).toBe(4);
  });

  it("builds a class sheet from each student's latest measurement", async () => {
    const { cls } = await setup();
    const [amy] = await listStudents(db, cls, 'shirt');
    await createMeasurement(db, {
      ...measurement(amy!.id),
      takenAt: '2026-01-01',
      values: { chest: 80 },
    });
    await createMeasurement(db, {
      ...measurement(amy!.id),
      takenAt: '2026-02-01',
      values: { chest: 82 },
    });
    const sheet = await listClassSheet(db, cls, 'shirt');
    expect(sheet.map((r) => r.name)).toEqual(['amy', 'Bob', 'Zed']);
    expect(JSON.parse(sheet[0]!.valuesJson!)).toEqual({ chest: 82 });
    expect(sheet[1]!.valuesJson).toBeNull();
  });

  it('deleting a class removes its students and their records, and nothing else', async () => {
    const { cls } = await setup();
    const keeper = await createClient(db, { name: 'Keeper', phone: '', notes: '' });
    const [amy] = await listStudents(db, cls, 'shirt');
    await createMeasurement(db, measurement(amy!.id));
    await deleteClass(db, cls);
    expect(await listStudents(db, cls, 'shirt')).toEqual([]);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM measurements').get() as { n: number }).n).toBe(
      0,
    );
    expect(await getClient(db, keeper)).not.toBeNull();
  });

  it('deleting a school removes its classes and students', async () => {
    const { school } = await setup();
    await deleteSchool(db, school);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM clients').get() as { n: number }).n).toBe(0);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM classes').get() as { n: number }).n).toBe(0);
  });

  it('adds students atomically: one failure rolls the whole batch back', async () => {
    const { cls } = await setup();
    const before = (await listStudents(db, cls, 'shirt')).length;
    await expect(addStudents(db, 'no-such-class', ['A', 'B'])).rejects.toThrow();
    expect((await listStudents(db, cls, 'shirt')).length).toBe(before);
  });
});

describe('settings', () => {
  it('stores unit, currency and the chosen measurement list', async () => {
    expect(await getSettings(db)).toEqual({ unit: 'cm', currencySymbol: '$' });
    await saveSetting(db, 'unit', 'in');
    await saveSetting(db, 'currencySymbol', 'KSh ');
    expect(await getSettings(db)).toEqual({ unit: 'in', currencySymbol: 'KSh ' });

    expect((await getEnabledFields(db)).has('neck')).toBe(true);
    await saveEnabledFields(db, ['calf']);
    expect([...(await getEnabledFields(db))]).toEqual(['calf']);
  });
});
