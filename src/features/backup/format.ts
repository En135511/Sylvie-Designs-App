import type { Client, Measurement, Order, School, SchoolClass, Settings } from '../../domain/types';
import { ORDER_STATUSES } from '../../domain/types';

/** v2 added schools, classes and clients.classId. v1 backups are still accepted. */
export const BACKUP_VERSION = 2;

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: Settings;
  schools: School[];
  classes: SchoolClass[];
  clients: Client[];
  measurements: Measurement[];
  orders: Order[];
}

export function serializeBackup(
  data: Omit<BackupData, 'version' | 'exportedAt'>,
  now = new Date(),
): string {
  const payload: BackupData = { version: BACKUP_VERSION, exportedAt: now.toISOString(), ...data };
  return JSON.stringify(payload, null, 2);
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function requireArray(value: unknown, name: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(`Backup is missing a valid "${name}" list.`);
  }
  return value;
}

function requireStrings(row: Record<string, unknown>, keys: string[], where: string): void {
  for (const key of keys) {
    if (!isString(row[key])) throw new Error(`Invalid "${key}" in ${where}.`);
  }
}

/** Validates untrusted backup JSON. Throws an Error with a user-readable message on failure. */
export function parseBackup(json: string): BackupData {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('This file is not a valid backup (could not read it).');
  }
  if (!isRecord(raw) || (raw.version !== BACKUP_VERSION && raw.version !== 1)) {
    throw new Error('This backup was made by an unsupported version of the app.');
  }

  const schools = raw.version === 1 ? [] : requireArray(raw.schools, 'schools');
  const classes = raw.version === 1 ? [] : requireArray(raw.classes, 'classes');
  const clients = requireArray(raw.clients, 'clients');
  const measurements = requireArray(raw.measurements, 'measurements');
  const orders = requireArray(raw.orders, 'orders');

  schools.forEach((s) => requireStrings(s, ['id', 'name', 'notes', 'createdAt'], 'a school'));
  classes.forEach((c) => requireStrings(c, ['id', 'schoolId', 'name', 'createdAt'], 'a class'));
  clients.forEach((c) =>
    requireStrings(c, ['id', 'name', 'phone', 'notes', 'createdAt', 'updatedAt'], 'a client'),
  );
  measurements.forEach((m) => {
    requireStrings(
      m,
      ['id', 'clientId', 'garment', 'notes', 'takenAt', 'createdAt'],
      'a measurement',
    );
    if (!isRecord(m.values) || !Object.values(m.values).every(isNumber)) {
      throw new Error('Invalid "values" in a measurement.');
    }
  });
  orders.forEach((o) => {
    requireStrings(
      o,
      ['id', 'clientId', 'garment', 'description', 'dueDate', 'status', 'createdAt', 'updatedAt'],
      'an order',
    );
    if (!isNumber(o.priceMinor) || !isNumber(o.depositMinor)) {
      throw new Error('Invalid amount in an order.');
    }
    if (!(ORDER_STATUSES as readonly string[]).includes(o.status as string)) {
      throw new Error('Invalid status in an order.');
    }
  });

  const schoolIds = new Set(schools.map((s) => s.id));
  if (classes.some((c) => !schoolIds.has(c.schoolId as string))) {
    throw new Error('Backup contains a class that belongs to a missing school.');
  }
  const classIds = new Set(classes.map((c) => c.id));
  const normalizedClients = clients.map((c) => ({ ...c, classId: c.classId ?? null }));
  if (normalizedClients.some((c) => c.classId !== null && !classIds.has(c.classId as string))) {
    throw new Error('Backup contains a student that belongs to a missing class.');
  }
  const clientIds = new Set(clients.map((c) => c.id));
  const orphan = [...measurements, ...orders].some((r) => !clientIds.has(r.clientId as string));
  if (orphan) throw new Error('Backup contains records that belong to a missing client.');

  const s = isRecord(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    unit: s.unit === 'in' ? 'in' : 'cm',
    currencySymbol: isString(s.currencySymbol) ? s.currencySymbol : '$',
  };

  return {
    version: BACKUP_VERSION,
    exportedAt: isString(raw.exportedAt) ? raw.exportedAt : '',
    settings,
    schools: schools as unknown as School[],
    classes: classes as unknown as SchoolClass[],
    clients: normalizedClients as unknown as Client[],
    measurements: measurements as unknown as Measurement[],
    orders: orders as unknown as Order[],
  };
}
