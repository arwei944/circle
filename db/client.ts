import path from 'node:path';
import { mkdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { runSeed } from './seed';

const DB_PATH = () => process.env.CIRCLE_DB_PATH ?? path.join(process.cwd(), 'data', 'circle.db');

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export function createSqliteClient(dbPath: string): Db {
   mkdirSync(path.dirname(dbPath), { recursive: true });
   const client = new Database(dbPath);
   client.pragma('journal_mode = WAL');
   client.pragma('foreign_keys = ON');
   return drizzle(client, { schema }) as Db;
}

let singleton: (Db & { _migrated?: boolean }) | null = null;

export function getDb(): Db {
   if (!singleton) singleton = createSqliteClient(DB_PATH());
   return singleton;
}

export async function ensureDb(): Promise<void> {
   const db = getDb();
   if (!(db as { _migrated?: boolean })._migrated) {
      migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
      (db as { _migrated?: boolean })._migrated = true;
   }
   if (process.env.SKIP_SEED !== '1') {
      const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number };
      if (c === 0) await runSeed(db);
   }
}

export function resetDbForTests(): void {
   if (singleton) {
      try {
         singleton.$client.close();
      } catch {
         /* already closed */
      }
   }
   singleton = null;
}
