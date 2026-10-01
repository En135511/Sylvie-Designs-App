import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_ENABLED_FIELDS, MEASUREMENT_FIELDS } from '../../domain/garments';
import { DEFAULT_SETTINGS, type Settings, type Unit } from '../../domain/types';

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const unit = map.get('unit');
  return {
    unit: unit === 'in' || unit === 'cm' ? (unit as Unit) : DEFAULT_SETTINGS.unit,
    currencySymbol: map.get('currencySymbol') ?? DEFAULT_SETTINGS.currencySymbol,
  };
}

export async function saveSetting<K extends keyof Settings>(
  db: SQLiteDatabase,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    String(value),
  );
}

const FIELDS_KEY = 'measurementFields';

/** Measurements the tailor has switched on; falls back to the essential set. */
export async function getEnabledFields(db: SQLiteDatabase): Promise<Set<string>> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    FIELDS_KEY,
  );
  return resolveEnabledFields(row?.value);
}

export async function saveEnabledFields(db: SQLiteDatabase, keys: Iterable<string>): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    FIELDS_KEY,
    JSON.stringify([...keys]),
  );
}

/** Parses the stored JSON list, ignoring unknown keys; undefined/invalid means "use defaults". */
export function resolveEnabledFields(stored: string | undefined): Set<string> {
  const known = new Set(MEASUREMENT_FIELDS.map((f) => f.key));
  try {
    const parsed: unknown = stored === undefined ? null : JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((k): k is string => typeof k === 'string' && known.has(k)));
    }
  } catch {
    // fall through to defaults
  }
  return new Set(DEFAULT_ENABLED_FIELDS);
}
