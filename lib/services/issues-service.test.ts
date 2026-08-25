import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { createIssue, deleteIssue, getIssue, listIssues, updateIssue } from './issues-service';

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

it('updateIssue updates scalar fields and replaces labels', async () => {
   const db = fresh();
   await runSeed(db);
   const created = createIssue(db, { title: 'before', labels: [] });
   const updated = updateIssue(db, created.id, {
      title: 'after',
      labels: ['bug', 'ui'],
   });
   expect(updated.title).toBe('after');
   expect(updated.labels.map((l) => l.id).sort()).toEqual(['bug', 'ui']);
   const reRead = getIssue(db, created.id);
   expect(reRead?.labels.map((l) => l.id)).toEqual(['bug', 'ui']);
});

it('updateIssue moves rank between neighbors', async () => {
   const db = fresh();
   await runSeed(db);
   const a = createIssue(db, { title: 'a' });
   const b = createIssue(db, { title: 'b' });
   updateIssue(db, b.id, { rank: { afterIssueId: a.id } });
   const list = listIssues(db);
   expect(list[0].identifier).toBe(a.identifier);
   expect(list[1].identifier).toBe(b.identifier);
});

it('deleteIssue returns false for missing and removes labels', async () => {
   const db = fresh();
   await runSeed(db);
   const created = createIssue(db, { title: 'x', labels: ['bug'] });
   expect(deleteIssue(db, 'missing')).toBe(false);
   expect(deleteIssue(db, created.id)).toBe(true);
   expect(getIssue(db, created.id)).toBeNull();
   const rels = db.$client
      .prepare('SELECT COUNT(*) AS c FROM issue_labels WHERE issue_id = ?')
      .get(created.id) as { c: number };
   expect(rels.c).toBe(0);
});

it('updateIssue rejects unknown rank anchors', async () => {
   const db = fresh();
   await runSeed(db);
   const created = createIssue(db, { title: 'x' });
   expect(() => updateIssue(db, created.id, { rank: { beforeIssueId: 'nope' } })).toThrow(
      /unknown before issue/
   );
   expect(() => updateIssue(db, created.id, { rank: { afterIssueId: 'nope' } })).toThrow(
      /unknown after issue/
   );
});

it('updateIssue rejects same or inverted rank anchors', async () => {
   const db = fresh();
   await runSeed(db);
   const a = createIssue(db, { title: 'a' });
   const b = createIssue(db, { title: 'b' });
   expect(() =>
      updateIssue(db, b.id, { rank: { beforeIssueId: a.id, afterIssueId: a.id } })
   ).toThrow();
   updateIssue(db, b.id, { rank: { afterIssueId: a.id } });
   expect(() =>
      updateIssue(db, a.id, { rank: { beforeIssueId: b.id, afterIssueId: b.id } })
   ).toThrow(/same issue/);
   expect(() =>
      updateIssue(db, a.id, { rank: { beforeIssueId: b.id, afterIssueId: a.id } })
   ).toThrow(/inverted|order/);
});
