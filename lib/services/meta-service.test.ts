import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { listMeta } from './meta-service';

const dbPath = path.join(process.cwd(), 'data', 'test-meta-service.db');

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

it('listMeta returns reference data', async () => {
   const db = fresh();
   await runSeed(db);
   const meta = listMeta(db);
   expect(meta.labels.length).toBeGreaterThan(5);
   expect(meta.projects.length).toBeGreaterThan(5);
   expect(meta.cycles.length).toBeGreaterThan(0);
   expect(meta.users.length).toBeGreaterThan(0);
});
