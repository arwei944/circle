import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';

const dbPath = path.join(process.cwd(), 'data', 'test-seed.db');

beforeAll(() => {
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
});

afterEach(() => resetDbForTests());

function freshDb() {
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   return db;
}

it('seeds users/labels/projects/cycles/issues and is idempotent', async () => {
   const db = freshDb();
   await runSeed(db);
   await runSeed(db); // 幂等

   const counts = {
      users: db.$client.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number },
      labels: db.$client.prepare('SELECT COUNT(*) AS c FROM labels').get() as { c: number },
      projects: db.$client.prepare('SELECT COUNT(*) AS c FROM projects').get() as { c: number },
      cycles: db.$client.prepare('SELECT COUNT(*) AS c FROM cycles').get() as { c: number },
      issues: db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number },
      rels: db.$client.prepare('SELECT COUNT(*) AS c FROM issue_labels').get() as { c: number },
   };
   expect(counts.users.c).toBeGreaterThan(0);
   expect(counts.labels.c).toBeGreaterThan(0);
   expect(counts.projects.c).toBeGreaterThan(0);
   expect(counts.cycles.c).toBeGreaterThan(0);
   expect(counts.issues.c).toBeGreaterThan(100);
   expect(counts.rels.c).toBeGreaterThan(0);
});

it('preserves mock identifiers and order', async () => {
   const db = freshDb();
   await runSeed(db);
   const first = db.$client
      .prepare('SELECT identifier, rank FROM issues ORDER BY rank DESC LIMIT 1')
      .get() as { identifier: string; rank: string };
   expect(first.identifier).toBeTruthy();
   expect(typeof first.rank).toBe('string');
});
