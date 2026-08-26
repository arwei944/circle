import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { toDateString } from '@/lib/dto';
import { createIssue } from './issues-service';
import { createCycle, deleteCycle, getCycle, listCycles, updateCycle } from './cycles-service';

const dbPath = path.join(process.cwd(), 'data', 'test-cycles-service.db');
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

describe('listCycles', () => {
   it('computes scope/started/completed/successRate from real issues', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, { name: 'agg', startDate: '2026-01-01', endDate: '2026-01-14' });
      createIssue(db, { title: 'done-i', cycleId: c.id, statusId: 'done' });
      createIssue(db, { title: 'started-i', cycleId: c.id, statusId: 'in-progress' });
      createIssue(db, { title: 'unstarted-i', cycleId: c.id, statusId: 'to-do' });
      const found = listCycles(db).find((x) => x.id === c.id)!;
      expect(found.scope).toBe(3);
      expect(found.completed).toBe(1);
      expect(found.started).toBe(1);
      expect(found.successRate).toBe(33); // round(1/3*100)
   });

   it('orders by startDate ascending', async () => {
      const db = fresh();
      await runSeed(db);
      createCycle(db, { name: 'later', startDate: '2027-01-01', endDate: '2027-01-14' });
      createCycle(db, { name: 'earlier', startDate: '2025-01-01', endDate: '2025-01-14' });
      const dates = listCycles(db).map((x) => x.startDate);
      expect([...dates].sort()).toEqual(dates);
   });
});

describe('getCycle', () => {
   it('returns burnup for current cycles, built from real issue dates', async () => {
      const db = fresh();
      await runSeed(db);
      const today = toDateString(Date.now());
      const c = createCycle(db, {
         name: 'current-c',
         status: 'current',
         startDate: today,
         endDate: today,
      });
      createIssue(db, { title: 'x', cycleId: c.id, statusId: 'done' });
      const got = getCycle(db, c.id)!;
      expect(got.status).toBe('current');
      expect(got.burnup).toBeDefined();
      expect(got.burnup).toHaveLength(1); // start===end → 1 个点
      expect(got.burnup![0].date).toBe(today);
      expect(got.burnup![0].scope).toBe(1);
      expect(got.burnup![0].completed).toBe(1);
   });

   it('omits burnup for planned/upcoming cycles', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, {
         name: 'planned-c',
         status: 'planned',
         startDate: '2026-09-01',
         endDate: '2026-09-14',
      });
      createIssue(db, { title: 'y', cycleId: c.id });
      const got = getCycle(db, c.id)!;
      expect(got.scope).toBe(1);
      expect(got.burnup).toBeUndefined();
   });

   it('returns null for unknown id', async () => {
      const db = fresh();
      await runSeed(db);
      expect(getCycle(db, 'nope')).toBeNull();
   });
});

describe('createCycle', () => {
   it('applies defaults (teamId CORE / status planned / capacity 100)', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, {
         name: 'defaults',
         startDate: '2026-01-01',
         endDate: '2026-01-14',
      });
      expect(c.id).toMatch(/^cyc_/);
      expect(c.teamId).toBe('CORE');
      expect(c.status).toBe('planned');
      expect(c.capacity).toBe(100);
      expect(c.scope).toBe(0);
      expect(c.completed).toBe(0);
      expect(c.successRate).toBe(0);
   });

   it('rejects empty name / bad dates / unknown status', async () => {
      const db = fresh();
      await runSeed(db);
      expect(() =>
         createCycle(db, { name: '  ', startDate: '2026-01-01', endDate: '2026-01-14' })
      ).toThrow(/name required/);
      expect(() =>
         createCycle(db, { name: 'bad', startDate: '2026-01-14', endDate: '2026-01-01' })
      ).toThrow(/startDate must be <= endDate/);
      expect(() =>
         createCycle(db, {
            name: 'bad',
            status: 'nope',
            startDate: '2026-01-01',
            endDate: '2026-01-14',
         })
      ).toThrow(/unknown cycle status/);
   });
});

describe('updateCycle', () => {
   it('persists changed fields and re-aggregates', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, { name: 'orig', startDate: '2026-01-01', endDate: '2026-01-14' });
      createIssue(db, { title: 'z', cycleId: c.id, statusId: 'done' });
      const u = updateCycle(db, c.id, { name: 'renamed', capacity: 50, status: 'current' });
      expect(u.name).toBe('renamed');
      expect(u.capacity).toBe(50);
      expect(u.status).toBe('current');
      expect(u.scope).toBe(1);
      expect(u.burnup).toBeDefined();
   });

   it('throws for unknown cycle / invalid merged dates', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, { name: 'orig', startDate: '2026-01-05', endDate: '2026-01-20' });
      expect(() => updateCycle(db, 'nope', { name: 'x' })).toThrow(/cycle not found/);
      expect(() => updateCycle(db, c.id, { startDate: '2026-01-21' })).toThrow(
         /startDate must be <= endDate/
      );
   });
});

describe('deleteCycle', () => {
   it('detaches issues (cycleId → "") and removes the cycle', async () => {
      const db = fresh();
      await runSeed(db);
      const c = createCycle(db, { name: 'del', startDate: '2026-01-01', endDate: '2026-01-14' });
      createIssue(db, { title: 'in-cycle', cycleId: c.id });
      expect(deleteCycle(db, c.id)).toBe(true);
      const orphan = db.$client
         .prepare('SELECT COUNT(*) AS c FROM issues WHERE cycle_id = ?')
         .get(c.id) as { c: number };
      expect(orphan.c).toBe(0);
      expect(getCycle(db, c.id)).toBeNull();
      expect(deleteCycle(db, c.id)).toBe(false);
   });
});
