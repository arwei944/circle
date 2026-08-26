import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

it('ensureDb backfills teams and initiative on a legacy (0000-only) db', async () => {
   const realMigrations = path.join(process.cwd(), 'db', 'migrations');
   const legacyDir = path.join(process.cwd(), 'data', 'legacy-migrations');
   const legacyPath = path.join(process.cwd(), 'data', 'test-v2-legacy.db');
   rmSync(legacyDir, { recursive: true, force: true });
   rmSync(legacyPath, { force: true });
   mkdirSync(path.join(legacyDir, 'meta'), { recursive: true });

   // 构造"只剩 0000"的迁移目录：真实 journal 过滤掉 0001 条目 + 复制 0000 SQL
   const journal = JSON.parse(
      readFileSync(path.join(realMigrations, 'meta', '_journal.json'), 'utf-8')
   ) as { version: string; dialect: string; entries: { idx: number; when: number; tag: string }[] };
   const legacyJournal = {
      version: journal.version,
      dialect: journal.dialect,
      entries: journal.entries.filter((e) => e.idx === 0),
   };
   writeFileSync(
      path.join(legacyDir, 'meta', '_journal.json'),
      JSON.stringify(legacyJournal, null, 3)
   );
   const legacySql = `${legacyJournal.entries[0].tag}.sql`;
   copyFileSync(path.join(realMigrations, legacySql), path.join(legacyDir, legacySql));

   // 1) 只跑 0000 迁移，建立"老库"（无 0001 列/表）
   const db = createSqliteClient(legacyPath);
   migrate(db, { migrationsFolder: legacyDir });
   const legacyTables = (
      db.$client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
         name: string;
      }[]
   ).map((r) => r.name);
   expect(legacyTables).not.toContain('teams');
   expect(legacyTables).not.toContain('project_updates');

   // 2) 手动插入老行：一个 project + 一条 issue（模拟"老库已用"，确保 seed 哨兵不为空）
   db.$client
      .prepare("INSERT INTO projects (id, name) VALUES ('legacy-proj', 'LNDev UI - 核心组件')")
      .run();
   db.$client
      .prepare(
         "INSERT INTO issues (id, identifier, title, created_at, `rank`) VALUES ('legacy-issue', 'LEGACY-1', 'x', 123, '0|legacy')"
      )
      .run();
   db.$client.close();
   rmSync(legacyDir, { recursive: true, force: true });

   // 3) 调用真实 ensureDb()（CIRCLE_DB_PATH 指到 legacyPath）→ 迁移 0001 + 补齐 teams/initiative
   resetDbForTests();
   process.env.CIRCLE_DB_PATH = legacyPath;
   await ensureDb();

   const upgraded = createSqliteClient(legacyPath);
   const teamsC = upgraded.$client.prepare('SELECT COUNT(*) AS c FROM teams').get() as {
      c: number;
   };
   expect(teamsC.c).toBeGreaterThan(0);
   const proj = upgraded.$client
      .prepare("SELECT initiative AS i FROM projects WHERE id = 'legacy-proj'")
      .get() as { i: string | null };
   expect(proj.i).not.toBeNull();
   const upTables = (
      upgraded.$client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
         name: string;
      }[]
   ).map((r) => r.name);
   expect(upTables).toContain('project_updates');
   expect(upTables).toContain('project_labels');
   upgraded.$client.close();

   // 4) 幂等 + "已有值不被覆盖"：置一个既有值和一个新 NULL，再跑 ensureDb
   const seeded = createSqliteClient(legacyPath);
   seeded.$client
      .prepare("UPDATE projects SET initiative = 'SENTINEL' WHERE id = 'legacy-proj'")
      .run();
   seeded.$client
      .prepare("INSERT INTO projects (id, name) VALUES ('legacy-proj-2', 'LNDev UI - 主题')")
      .run();
   seeded.$client.close();
   resetDbForTests();
   process.env.CIRCLE_DB_PATH = legacyPath;
   await ensureDb();
   const recheck = createSqliteClient(legacyPath);
   const sentinel = recheck.$client
      .prepare("SELECT initiative AS i FROM projects WHERE id = 'legacy-proj'")
      .get() as { i: string | null };
   expect(sentinel.i).toBe('SENTINEL');
   const backfilled = recheck.$client
      .prepare("SELECT initiative AS i FROM projects WHERE id = 'legacy-proj-2'")
      .get() as { i: string | null };
   expect(backfilled.i).not.toBeNull();
   recheck.$client.close();
   resetDbForTests();
   process.env.CIRCLE_DB_PATH = dbPath;
});
