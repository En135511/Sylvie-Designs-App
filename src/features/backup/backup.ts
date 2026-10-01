import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { listClients } from '../../db/repositories/clients';
import { getSettings } from '../../db/repositories/settings';
import { parseBackup, serializeBackup, type BackupData } from './format';
import type { Measurement, Order } from '../../domain/types';

async function collect(db: SQLiteDatabase) {
  const [clients, settings, measurementRows, orderRows] = await Promise.all([
    listClients(db),
    getSettings(db),
    db.getAllAsync<{
      id: string;
      client_id: string;
      garment: string;
      values_json: string;
      notes: string;
      taken_at: string;
      created_at: string;
    }>('SELECT * FROM measurements'),
    db.getAllAsync<{
      id: string;
      client_id: string;
      garment: string;
      description: string;
      due_date: string;
      price_minor: number;
      deposit_minor: number;
      status: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM orders'),
  ]);

  const measurements = measurementRows.map((r): Measurement => ({
    id: r.id,
    clientId: r.client_id,
    garment: r.garment,
    values: JSON.parse(r.values_json) as Measurement['values'],
    notes: r.notes,
    takenAt: r.taken_at,
    createdAt: r.created_at,
  }));
  const orders = orderRows.map((r): Order => ({
    id: r.id,
    clientId: r.client_id,
    garment: r.garment,
    description: r.description,
    dueDate: r.due_date,
    priceMinor: r.price_minor,
    depositMinor: r.deposit_minor,
    status: r.status as Order['status'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  return { clients, measurements, orders, settings };
}

/** Writes a JSON backup to the cache and opens the Android share sheet. */
export async function exportBackup(db: SQLiteDatabase): Promise<void> {
  const json = serializeBackup(await collect(db));
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `sylvie-designs-backup-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save or send your backup',
  });
}

/** Lets the user pick a backup file. Returns null if they cancel. */
export async function pickBackup(): Promise<BackupData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const text = await new File(result.assets[0].uri).text();
  return parseBackup(text);
}

/** Replaces ALL data with the backup contents, atomically. */
export async function restoreBackup(db: SQLiteDatabase, data: BackupData): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM orders');
    await db.runAsync('DELETE FROM measurements');
    await db.runAsync('DELETE FROM clients');
    // Feature switches are device configuration, not data: keep them across a restore.
    await db.runAsync("DELETE FROM settings WHERE key NOT LIKE 'flag:%'");

    for (const c of data.clients) {
      await db.runAsync(
        'INSERT INTO clients (id, name, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        c.id,
        c.name,
        c.phone,
        c.notes,
        c.createdAt,
        c.updatedAt,
      );
    }
    for (const m of data.measurements) {
      await db.runAsync(
        `INSERT INTO measurements (id, client_id, garment, values_json, notes, taken_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        m.id,
        m.clientId,
        m.garment,
        JSON.stringify(m.values),
        m.notes,
        m.takenAt,
        m.createdAt,
      );
    }
    for (const o of data.orders) {
      await db.runAsync(
        `INSERT INTO orders (id, client_id, garment, description, due_date, price_minor, deposit_minor, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        o.id,
        o.clientId,
        o.garment,
        o.description,
        o.dueDate,
        o.priceMinor,
        o.depositMinor,
        o.status,
        o.createdAt,
        o.updatedAt,
      );
    }
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      'unit',
      data.settings.unit,
    );
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      'currencySymbol',
      data.settings.currencySymbol,
    );
  });
}
