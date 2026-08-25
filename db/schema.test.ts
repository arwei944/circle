import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = path.join(process.cwd(), 'data', 'test-schema.db');

beforeAll(() => {
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
});

afterEach(() => resetDbForTests());

it('migrates all tables', () => {
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   const rows = db.$client
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
   const tables = rows.map((r) => r.name);
   for (const t of ['users', 'labels', 'projects', 'cycles', 'issues', 'issue_labels']) {
      expect(tables).toContain(t);
   }
});
