import type { SQLiteDatabase } from 'expo-sqlite';
import type { Client } from '../../domain/types';
import { newId, nowISO } from '../../utils/id';

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const toClient = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export type ClientInput = Pick<Client, 'name' | 'phone' | 'notes'>;

export async function listClients(db: SQLiteDatabase, search = ''): Promise<Client[]> {
  const term = `%${search.trim().replace(/[%_\\]/g, '\\$&')}%`;
  const rows = await db.getAllAsync<ClientRow>(
    `SELECT * FROM clients
     WHERE name LIKE ?1 ESCAPE '\\' OR phone LIKE ?1 ESCAPE '\\'
     ORDER BY name COLLATE NOCASE`,
    term,
  );
  return rows.map(toClient);
}

export async function getClient(db: SQLiteDatabase, id: string): Promise<Client | null> {
  const row = await db.getFirstAsync<ClientRow>('SELECT * FROM clients WHERE id = ?', id);
  return row ? toClient(row) : null;
}

export async function createClient(db: SQLiteDatabase, input: ClientInput): Promise<string> {
  const id = newId();
  const now = nowISO();
  await db.runAsync(
    'INSERT INTO clients (id, name, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.name.trim(),
    input.phone.trim(),
    input.notes.trim(),
    now,
    now,
  );
  return id;
}

export async function updateClient(
  db: SQLiteDatabase,
  id: string,
  input: ClientInput,
): Promise<void> {
  await db.runAsync(
    'UPDATE clients SET name = ?, phone = ?, notes = ?, updated_at = ? WHERE id = ?',
    input.name.trim(),
    input.phone.trim(),
    input.notes.trim(),
    nowISO(),
    id,
  );
}

/** Deleting a client also deletes their measurements and orders (ON DELETE CASCADE). */
export async function deleteClient(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM clients WHERE id = ?', id);
}
