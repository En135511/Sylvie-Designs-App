import type { SQLiteDatabase } from 'expo-sqlite';
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
