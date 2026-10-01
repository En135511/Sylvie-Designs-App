import { createRequire } from 'node:module';
import type { SQLiteDatabase } from 'expo-sqlite';

// node:sqlite ships with Node 22; the shim below mimics the slice of expo-sqlite's async API
// that the repositories use, so their real SQL runs against a real SQLite engine.
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

type Params = (string | number | null)[];
const flat = (p: unknown[]): Params => (p.length === 1 && Array.isArray(p[0]) ? p[0] : p) as Params;

export function createTestDb(): { db: SQLiteDatabase; raw: InstanceType<typeof DatabaseSync> } {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON');
  const shim = {
    execAsync: async (sql: string) => void raw.exec(sql),
    getAllAsync: async (sql: string, ...p: unknown[]) => raw.prepare(sql).all(...flat(p)),
    getFirstAsync: async (sql: string, ...p: unknown[]) => raw.prepare(sql).get(...flat(p)) ?? null,
    runAsync: async (sql: string, ...p: unknown[]) => {
      const r = raw.prepare(sql).run(...flat(p));
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { db: shim as unknown as SQLiteDatabase, raw };
}
