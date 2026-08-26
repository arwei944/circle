import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { createIssue, listIssues, updateIssue } from './issues-service';
import {
   listProjects,
   getProject,
   createProject,
   updateProject,
   deleteProject,
   listProjectUpdates,
   createProjectUpdate,
   deleteProjectUpdate,
} from './projects-service';

const dbPath = path.join(process.cwd(), 'data', 'test-projects-service.db');
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

it('listProjects computes totalIssues/completedIssues/percentComplete from real issues', async () => {
   const db = fresh();
   await runSeed(db);
   const project = listProjects(db)[0];
   expect(project).toMatchObject({ id: expect.any(String), name: expect.any(String) });
   expect(project.totalIssues).toBeTypeOf('number');
   expect(project.completedIssues).toBeTypeOf('number');
   expect(project.percentComplete).toBeGreaterThanOrEqual(0);
   expect(Array.isArray(project.labels)).toBe(true);
});

it('createProject + updateProject + deleteProject semantics', async () => {
   const db = fresh();
   await runSeed(db);
   const p = createProject(db, {
      name: '新项目',
      startDate: '2026-01-01',
      targetDate: '2026-12-31',
   });
   expect(p.id).toBeTruthy();
   expect(p.percentComplete).toBe(0);

   const updated = updateProject(db, p.id, { name: '改名', priority: 'high' });
   expect(updated.name).toBe('改名');

   // 建一个 issue 挂到该项目
   const proj2 = createProject(db, { name: '待删' });
   createIssue(db, { title: 'in-proj', projectId: proj2.id });
   expect(deleteProject(db, proj2.id)).toBe(true);
   // 删除后 issue.projectId 置 NULL
   const orphan = db.$client
      .prepare('SELECT COUNT(*) AS c FROM issues WHERE project_id = ?')
      .get(proj2.id) as { c: number };
   expect(orphan.c).toBe(0);
   expect(getProject(db, proj2.id)).toBeNull();
});

it('project updates persist and filter by project', async () => {
   const db = fresh();
   await runSeed(db);
   const p = createProject(db, { name: 'updates-p' });
   const u = createProjectUpdate(db, p.id, { message: '进展顺利', health: 'on-track' });
   expect(u.message).toBe('进展顺利');
   const list = listProjectUpdates(db, p.id);
   expect(list).toHaveLength(1);
   expect(list[0].health).toBe('on-track');
   expect(deleteProjectUpdate(db, p.id, u.id)).toBe(true);
   expect(listProjectUpdates(db, p.id)).toHaveLength(0);
});

it('aggregates totalIssues/completedIssues/percentComplete from real issues', async () => {
   const db = fresh();
   await runSeed(db);
   const p = createProject(db, { name: 'agg-proj' });
   createIssue(db, { title: 'a', projectId: p.id, statusId: 'done' });
   createIssue(db, { title: 'b', projectId: p.id, statusId: 'backlog' });
   const got = getProject(db, p.id)!;
   expect(got.totalIssues).toBe(2);
   expect(got.completedIssues).toBe(1);
   expect(got.percentComplete).toBe(50);
   // update issue 后聚合取真值
   const issueA = listIssues(db).find((i) => i.title === 'a')!;
   updateIssue(db, issueA.id, { statusId: 'backlog' });
   expect(getProject(db, p.id)!.completedIssues).toBe(0);
   expect(getProject(db, p.id)!.percentComplete).toBe(0);
});
