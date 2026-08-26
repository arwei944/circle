import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests, ensureDb } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';

const dbPath = path.join(process.cwd(), 'data', 'test-v2.db');

beforeAll(() => {
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
});
afterEach(() => resetDbForTests());

const fresh = () => {
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   return db;
};

it('v2 migration adds columns and tables', () => {
   const db = fresh();
   const cols = db.$client.prepare('PRAGMA table_info(issues)').all() as { name: string }[];
   expect(cols.some((c) => c.name === 'completed_at')).toBe(true);
   const pcols = db.$client.prepare('PRAGMA table_info(projects)').all() as { name: string }[];
   expect(pcols.some((c) => c.name === 'initiative')).toBe(true);
   const ccols = db.$client.prepare('PRAGMA table_info(cycles)').all() as { name: string }[];
   expect(ccols.some((c) => c.name === 'capacity')).toBe(true);
   const tables = (
      db.$client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
         name: string;
      }[]
   ).map((r) => r.name);
   expect(tables).toContain('project_updates');
   expect(tables).toContain('project_labels');
   expect(tables).toContain('teams');
});

it('seed fills teams, project_labels; ensureDb backfills legacy db', async () => {
   const db = fresh();
   await runSeed(db);
   const tc = db.$client.prepare('SELECT COUNT(*) AS c FROM teams').get() as { c: number };
   expect(tc.c).toBeGreaterThan(0);
   const plc = db.$client.prepare('SELECT COUNT(*) AS c FROM project_labels').get() as {
      c: number;
   };
   expect(plc.c).toBeGreaterThan(0);
});
