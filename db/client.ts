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
      // 仅全新空库才 seed（哨兵：issues 表，与 runSeed 一致）
      const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number };
      if (c === 0) await runSeed(db);
   }

   // 老库补齐：teams 参考表（幂等，仅空表时填一次）
   const teamsStmt = db.$client.prepare('SELECT COUNT(*) AS c FROM teams');
   if ((teamsStmt.get() as { c: number }).c === 0) {
      const { teams: mockTeams } = await import('@/mock-data/teams');
      const insertTeam = db.$client.prepare(
         'INSERT OR IGNORE INTO teams (id, name, icon, color, joined) VALUES (?,?,?,?,?)'
      );
      for (const t of mockTeams) {
         insertTeam.run(t.id, t.name, t.icon, t.color, t.joined ? 1 : 0);
      }
   }

   // 老库补齐：projects.initiative（按 mock name 匹配，已有值则不动；轻量、仅补一次）
   const initRows = db.$client
      .prepare('SELECT COUNT(*) AS c FROM projects WHERE initiative IS NULL')
      .get() as { c: number };
   if (initRows.c > 0) {
      const { projects: mockProjects } = await import('@/mock-data/projects');
      const updateInit = db.$client.prepare(
         'UPDATE projects SET initiative = ? WHERE name = ? AND initiative IS NULL'
      );
      for (const p of mockProjects) {
         if (!p.initiative) continue;
         updateInit.run(p.initiative, p.name);
      }
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
