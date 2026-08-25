import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { createIssue, getIssue, listIssues } from './issues-service';

const dbPath = path.join(process.cwd(), 'data', 'test-service.db');

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

it('lists seeded issues ordered by rank desc', async () => {
   const db = fresh();
   await runSeed(db);
   const list = listIssues(db);
   expect(list.length).toBeGreaterThan(100);
   const ranks = list.map((i) => i.rank);
   const sorted = [...ranks].sort((a, b) => b.localeCompare(a));
   expect(ranks).toEqual(sorted);
});

it('createIssue generates identifier P-xxx, rank on top, with labels', async () => {
   const db = fresh();
   await runSeed(db);
   const issue = createIssue(db, {
      title: '测试创建',
      labels: ['bug'],
   });
   expect(issue.identifier).toMatch(/^P-\d{3}$/);
   expect(issue.title).toBe('测试创建');
   expect(issue.statusId).toBe('backlog');
   expect(issue.priorityId).toBe('no-priority');
   expect(issue.labels.map((l) => l.id)).toContain('bug');
   const list = listIssues(db);
   expect(list[0].identifier).toBe(issue.identifier); // 新问题置顶
});

it('getIssue returns null for missing id', async () => {
   const db = fresh();
   await runSeed(db);
   expect(getIssue(db, 'nope')).toBeNull();
});
