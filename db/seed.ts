import type { Db } from './client';
import { users as mockUsers } from '@/mock-data/users';
import { labels as mockLabels } from '@/mock-data/labels';
import { projects as mockProjects } from '@/mock-data/projects';
import { cycles as mockCycles } from '@/mock-data/cycles';
import { issues as mockIssues } from '@/mock-data/issues';
import { teams as mockTeams } from '@/mock-data/teams';
import {
   labels,
   projects,
   cycles,
   users,
   issues,
   issueLabels,
   teams,
   projectLabels,
} from './schema';

const toEpochMs = (iso: string | undefined): number => {
   if (!iso) return Date.now();
   const t = Date.parse(iso);
   return Number.isNaN(t) ? Date.now() : t;
};

export async function runSeed(db: Db): Promise<void> {
   // 哨兵：仅全新空库（issues 为 0）才 seed；与 ensureDb 保持一致
   const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number };
   if (c > 0) return; // 幂等：已有数据则跳过

   db.$client.transaction(() => {
      db.insert(users)
         .values(
            mockUsers.map((u) => ({
               id: u.id,
               name: u.name,
               email: u.email,
               avatarUrl: u.avatarUrl,
               timezone: u.timezone,
               status: u.status,
               role: u.role,
               joinedDate: u.joinedDate,
               teamIds: u.teamIds,
            }))
         )
         .run();

      db.insert(labels)
         .values(mockLabels.map((l) => ({ id: l.id, name: l.name, color: l.color })))
         .run();

      db.insert(projects)
         .values(
            mockProjects.map((p, i) => ({
               id: p.id,
               name: p.name,
               iconIndex: i % 9,
               color: '#8f9299',
               description: '',
               statusId: p.status.id,
               health: p.health.id,
               priority: p.priority.id,
               leadId: p.lead?.id ?? null,
               startDate: p.startDate ?? null,
               targetDate: p.targetDate ?? null,
               initiative: p.initiative ?? null,
               percentComplete: p.percentComplete,
               teamId: p.teamId,
            }))
         )
         .run();

      db.insert(cycles)
         .values(
            mockCycles.map((cy) => ({
               id: cy.id,
               name: cy.name,
               teamId: cy.teamId,
               status: cy.status,
               startDate: cy.startDate,
               endDate: cy.endDate,
               capacity: cy.capacity,
            }))
         )
         .run();

      db.insert(issues)
         .values(
            mockIssues.map((iss, i) => ({
               id: iss.id || `seed-issue-${i}`,
               identifier: iss.identifier,
               title: iss.title,
               description: iss.description,
               statusId: iss.status.id,
               priorityId: iss.priority.id,
               assigneeId: iss.assignee?.id ?? null,
               projectId: iss.project?.id ?? null,
               cycleId: iss.cycleId ?? '',
               createdAt: toEpochMs(iss.createdAt),
               dueDate: iss.dueDate ? toEpochMs(iss.dueDate) : null,
               rank: iss.rank,
               subissues: iss.subissues ?? [],
            }))
         )
         .run();

      const rows = db.$client.prepare('SELECT id, identifier FROM issues').all() as {
         id: string;
         identifier: string;
      }[];
      const idByIdentifier = new Map(rows.map((r) => [r.identifier, r.id]));
      const rels: { issueId: string; labelId: string }[] = [];
      for (const iss of mockIssues) {
         const issueId = idByIdentifier.get(iss.identifier);
         if (!issueId) continue;
         for (const label of iss.labels) {
            rels.push({ issueId, labelId: label.id });
         }
      }
      if (rels.length > 0) db.insert(issueLabels).values(rels).run();

      db.insert(teams)
         .values(
            mockTeams.map((t) => ({
               id: t.id,
               name: t.name,
               icon: t.icon,
               color: t.color,
               joined: t.joined ? 1 : 0,
            }))
         )
         .run();

      // project_labels：按 mock project.labels 关联
      const pRows = db.$client.prepare('SELECT id, name FROM projects').all() as {
         id: string;
         name: string;
      }[];
      const pLabels: { projectId: string; labelId: string }[] = [];
      for (const p of mockProjects) {
         const pid = pRows.find((r) => r.name === p.name)?.id;
         if (!pid) continue;
         for (const l of p.labels) pLabels.push({ projectId: pid, labelId: l.id });
      }
      if (pLabels.length > 0) db.insert(projectLabels).values(pLabels).run();
   })();
}

export async function main(): Promise<void> {
   const { createSqliteClient } = await import('./client');
   const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
   const path = await import('node:path');
   const dbPath = process.env.CIRCLE_DB_PATH ?? path.join(process.cwd(), 'data', 'circle.db');
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   await runSeed(db);
   const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number };
   console.log(`seed ok. issues: ${c}`);
   db.$client.close();
}

if (process.argv[1]?.endsWith('seed.ts')) {
   main()
      .then(() => process.exit(0))
      .catch((e) => {
         console.error(e);
         process.exit(1);
      });
}
