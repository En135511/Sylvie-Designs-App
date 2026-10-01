import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered, append-only list of schema migrations. Never edit a shipped migration;
 * add a new one. The applied version is tracked with `PRAGMA user_version`.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE clients (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_clients_name ON clients(name COLLATE NOCASE);

  CREATE TABLE measurements (
    id TEXT PRIMARY KEY NOT NULL,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    garment TEXT NOT NULL,
    values_json TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    taken_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_measurements_client ON measurements(client_id, taken_at DESC);

  CREATE TABLE orders (
    id TEXT PRIMARY KEY NOT NULL,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    garment TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT NOT NULL,
    price_minor INTEGER NOT NULL DEFAULT 0,
    deposit_minor INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_orders_client ON orders(client_id);
  CREATE INDEX idx_orders_due ON orders(status, due_date);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]!);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
