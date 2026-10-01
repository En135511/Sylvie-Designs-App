import type { Client, Measurement, Order, Settings } from '../../domain/types';
import { ORDER_STATUSES } from '../../domain/types';

export const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: Settings;
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
  if (!isRecord(raw) || raw.version !== BACKUP_VERSION) {
    throw new Error('This backup was made by an unsupported version of the app.');
  }

  const clients = requireArray(raw.clients, 'clients');
  const measurements = requireArray(raw.measurements, 'measurements');
  const orders = requireArray(raw.orders, 'orders');

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
    clients: clients as unknown as Client[],
    measurements: measurements as unknown as Measurement[],
    orders: orders as unknown as Order[],
  };
}
