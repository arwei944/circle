import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@/db/client';
import {
   issues,
   labels as labelsTable,
   projectLabels as projectLabelsTable,
   projectUpdates,
   projects,
   teams as teamsTable,
   users,
} from '@/db/schema';
import type { LeanLabel, LeanProject, LeanProjectUpdate, LeanUser } from '@/lib/dto';
import { status as statuses } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';

const COMPLETED_IDS = statuses.filter((s) => s.category === 'completed').map((s) => s.id);
const VALID_STATUS = statuses.map((s) => s.id);
const VALID_PRIORITY = priorities.map((p) => p.id);
const VALID_HEALTH = ['no-update', 'off-track', 'on-track', 'at-risk'];

export interface CreateProjectInput {
   name: string;
   iconIndex?: number;
   color?: string;
   description?: string;
   statusId?: string;
   priority?: string;
   health?: string;
   leadId?: string | null;
   startDate?: string | null;
   targetDate?: string | null;
   teamId?: string;
   initiative?: string | null;
   labels?: string[];
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

type CountedProject = typeof projects.$inferSelect & {
   totalIssues: number;
   completedIssues: number;
   healthUpdatedAgoDays: number | null;
};

type ProjectRelations = {
   row: CountedProject;
   labels: (typeof labelsTable.$inferSelect)[];
   lead: typeof users.$inferSelect | null;
};

const toLeanUser = (u: typeof users.$inferSelect): LeanUser => ({
   id: u.id,
   name: u.name,
   email: u.email,
   avatarUrl: u.avatarUrl,
   timezone: u.timezone,
   status: u.status,
   role: u.role,
   joinedDate: u.joinedDate,
   teamIds: u.teamIds,
});

const toLeanLabel = (l: typeof labelsTable.$inferSelect): LeanLabel => ({
   id: l.id,
   name: l.name,
   color: l.color,
});

const toLeanProjectUpdate = (u: typeof projectUpdates.$inferSelect): LeanProjectUpdate => ({
   id: u.id,
   projectId: u.projectId,
   message: u.message,
   health: u.health,
   authorId: u.authorId,
   createdAt: u.createdAt,
});

function toLean(rel: ProjectRelations): LeanProject {
   const { row, labels, lead } = rel;
   const percentComplete =
      row.totalIssues === 0 ? 0 : Math.round((row.completedIssues / row.totalIssues) * 100);
   return {
      id: row.id,
      name: row.name,
      iconIndex: row.iconIndex,
      color: row.color,
      description: row.description,
      statusId: row.statusId,
      health: row.health,
      priority: row.priority,
      leadId: row.leadId,
      startDate: row.startDate,
      targetDate: row.targetDate,
      percentComplete,
      teamId: row.teamId,
      initiative: row.initiative,
      labels: labels.map(toLeanLabel),
      totalIssues: row.totalIssues,
      completedIssues: row.completedIssues,
      healthUpdatedAgoDays: row.healthUpdatedAgoDays ?? undefined,
      lead: lead ? toLeanUser(lead) : null,
   };
}

/** 一次查 issues 聚合 + 一次查最近 update，补齐 totalIssues/completedIssues/healthUpdatedAgoDays。 */
function withCounts(db: Db, rows: (typeof projects.$inferSelect)[]): CountedProject[] {
   const placeholders = COMPLETED_IDS.map(() => '?').join(', ');
   const issueRows = db.$client
      .prepare(
         `SELECT project_id AS projectId, COUNT(*) AS total,
          COALESCE(SUM(status_id IN (${placeholders})), 0) AS done
          FROM issues WHERE project_id IS NOT NULL GROUP BY project_id`
      )
      .all(...COMPLETED_IDS) as { projectId: string; total: number; done: number }[];
   const updateRows = db.$client
      .prepare(
         'SELECT project_id AS projectId, MAX(created_at) AS latest FROM project_updates GROUP BY project_id'
      )
      .all() as { projectId: string; latest: number }[];
   const countMap = new Map(issueRows.map((r) => [r.projectId, { total: r.total, done: r.done }]));
   const updateMap = new Map(updateRows.map((r) => [r.projectId, r.latest]));
   return rows.map((row) => {
      const counts = countMap.get(row.id);
      const latest = updateMap.get(row.id);
      return {
         ...row,
         totalIssues: counts?.total ?? 0,
         completedIssues: counts?.done ?? 0,
         healthUpdatedAgoDays:
            latest == null ? null : Math.max(0, Math.floor((Date.now() - latest) / 86400000)),
      };
   });
}

/** 按顺序装载 labels（project_labels → labels）与 lead（users）。 */
function loadProjectRelations(db: Db, projectRows: CountedProject[]): ProjectRelations[] {
   if (projectRows.length === 0) return [];
   const ids = projectRows.map((r) => r.id);
   const labelRows = db
      .select({ projectId: projectLabelsTable.projectId, label: labelsTable })
      .from(projectLabelsTable)
      .innerJoin(labelsTable, eq(projectLabelsTable.labelId, labelsTable.id))
      .where(inArray(projectLabelsTable.projectId, ids))
      .all();
   const labelMap = new Map<string, (typeof labelsTable.$inferSelect)[]>();
   for (const row of labelRows) {
      const arr = labelMap.get(row.projectId) ?? [];
      arr.push(row.label);
      labelMap.set(row.projectId, arr);
   }
   const leadIds = [
      ...new Set(projectRows.map((r) => r.leadId).filter((id): id is string => id != null)),
   ];
   const leadRows =
      leadIds.length > 0 ? db.select().from(users).where(inArray(users.id, leadIds)).all() : [];
   const leadMap = new Map(leadRows.map((u) => [u.id, u]));
   return projectRows.map((row) => ({
      row,
      labels: labelMap.get(row.id) ?? [],
      lead: row.leadId ? (leadMap.get(row.leadId) ?? null) : null,
   }));
}

function assertValid(statusId: string, priority: string, health: string): void {
   if (!VALID_STATUS.includes(statusId)) throw new Error(`unknown status: ${statusId}`);
   if (!VALID_PRIORITY.includes(priority)) throw new Error(`unknown priority: ${priority}`);
   if (!VALID_HEALTH.includes(health)) throw new Error(`unknown health: ${health}`);
}

export function assertProjectRefs(
   db: Db,
   refs: { leadId?: string | null; teamId?: string; labelIds?: string[] }
): void {
   if (refs.leadId) {
      const u = db.select().from(users).where(eq(users.id, refs.leadId)).get();
      if (!u) throw new Error(`unknown lead: ${refs.leadId}`);
   }
   if (refs.teamId) {
      const t = db.select().from(teamsTable).where(eq(teamsTable.id, refs.teamId)).get();
      if (!t) throw new Error(`unknown team: ${refs.teamId}`);
   }
   for (const labelId of refs.labelIds ?? []) {
      const l = db.select().from(labelsTable).where(eq(labelsTable.id, labelId)).get();
      if (!l) throw new Error(`unknown label: ${labelId}`);
   }
}

export function listProjects(db: Db): LeanProject[] {
   const rows = withCounts(db, db.select().from(projects).all()).sort((a, b) =>
      a.name.localeCompare(b.name, 'zh')
   );
   return loadProjectRelations(db, rows).map(toLean);
}

export function getProject(db: Db, id: string): LeanProject | null {
   const row = withCounts(db, db.select().from(projects).where(eq(projects.id, id)).all())[0];
   if (!row) return null;
   return toLean(loadProjectRelations(db, [row])[0]);
}

export function createProject(db: Db, input: CreateProjectInput): LeanProject {
   const statusId = input.statusId ?? 'to-do';
   const priority = input.priority ?? 'no-priority';
   const health = input.health ?? 'no-update';
   if (!input.name.trim()) throw new Error('name required');
   assertValid(statusId, priority, health);
   assertProjectRefs(db, {
      leadId: input.leadId,
      teamId: input.teamId,
      labelIds: input.labels,
   });

   const id = `proj_${randomUUID()}`;
   db.$client.transaction(() => {
      db.insert(projects)
         .values({
            id,
            name: input.name.trim(),
            iconIndex: input.iconIndex ?? 0,
            color: input.color ?? '#8f9299',
            description: input.description ?? '',
            statusId,
            health,
            priority,
            leadId: input.leadId ?? null,
            startDate: input.startDate ?? null,
            targetDate: input.targetDate ?? null,
            percentComplete: 0,
            teamId: input.teamId ?? 'CORE',
            initiative: input.initiative ?? null,
         })
         .run();
      const labelIds = [...new Set(input.labels ?? [])];
      if (labelIds.length > 0) {
         db.insert(projectLabelsTable)
            .values(labelIds.map((labelId) => ({ projectId: id, labelId })))
            .run();
      }
   })();

   const created = getProject(db, id);
   if (!created) throw new Error('create failed');
   return created;
}

export function updateProject(db: Db, id: string, input: UpdateProjectInput): LeanProject {
   const existing = db.select().from(projects).where(eq(projects.id, id)).get();
   if (!existing) throw new Error(`project not found: ${id}`);

   const statusId = input.statusId ?? existing.statusId;
   const priority = input.priority ?? existing.priority;
   const health = input.health ?? existing.health;
   assertValid(statusId, priority, health);
   assertProjectRefs(db, {
      leadId: input.leadId !== undefined ? input.leadId : existing.leadId,
      teamId: input.teamId !== undefined ? input.teamId : existing.teamId,
      labelIds: input.labels,
   });

   db.$client.transaction(() => {
      db.update(projects)
         .set({
            name: input.name !== undefined ? input.name.trim() : existing.name,
            iconIndex: input.iconIndex !== undefined ? input.iconIndex : existing.iconIndex,
            color: input.color !== undefined ? input.color : existing.color,
            description: input.description !== undefined ? input.description : existing.description,
            statusId,
            health,
            priority,
            leadId: input.leadId !== undefined ? input.leadId : existing.leadId,
            startDate: input.startDate !== undefined ? input.startDate : existing.startDate,
            targetDate: input.targetDate !== undefined ? input.targetDate : existing.targetDate,
            teamId: input.teamId !== undefined ? input.teamId : existing.teamId,
            initiative: input.initiative !== undefined ? input.initiative : existing.initiative,
         })
         .where(eq(projects.id, id))
         .run();

      if (input.labels !== undefined) {
         db.delete(projectLabelsTable).where(eq(projectLabelsTable.projectId, id)).run();
         const labelIds = [...new Set(input.labels)];
         if (labelIds.length > 0) {
            db.insert(projectLabelsTable)
               .values(labelIds.map((labelId) => ({ projectId: id, labelId })))
               .run();
         }
      }
   })();

   const updated = getProject(db, id);
   if (!updated) throw new Error('update failed');
   return updated;
}

export function deleteProject(db: Db, id: string): boolean {
   const existing = db.select().from(projects).where(eq(projects.id, id)).get();
   if (!existing) return false;
   db.$client.transaction(() => {
      // issues.project_id 无 FK 引用 → 手工置 NULL，不级联删 issue
      db.update(issues).set({ projectId: null }).where(eq(issues.projectId, id)).run();
      // project_updates / project_labels 有 FK ON DELETE CASCADE → 随行删除
      db.delete(projects).where(eq(projects.id, id)).run();
   })();
   return true;
}

export function listProjectUpdates(db: Db, projectId: string): LeanProjectUpdate[] {
   return db
      .select()
      .from(projectUpdates)
      .where(eq(projectUpdates.projectId, projectId))
      .orderBy(desc(projectUpdates.createdAt))
      .all()
      .map(toLeanProjectUpdate);
}

export function createProjectUpdate(
   db: Db,
   projectId: string,
   input: { message: string; health: string }
): LeanProjectUpdate {
   const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
   if (!project) throw new Error(`project not found: ${projectId}`);
   if (!VALID_HEALTH.includes(input.health)) throw new Error(`unknown health: ${input.health}`);
   if (!input.message.trim()) throw new Error('message required');

   const id = `pu_${randomUUID()}`;
   const createdAt = Date.now();
   db.insert(projectUpdates)
      .values({
         id,
         projectId,
         message: input.message.trim(),
         health: input.health,
         authorId: null,
         createdAt,
      })
      .run();

   const row = db.select().from(projectUpdates).where(eq(projectUpdates.id, id)).get();
   if (!row) throw new Error('create failed');
   return toLeanProjectUpdate(row);
}

export function deleteProjectUpdate(db: Db, projectId: string, updateId: string): boolean {
   const existing = db
      .select()
      .from(projectUpdates)
      .where(and(eq(projectUpdates.id, updateId), eq(projectUpdates.projectId, projectId)))
      .get();
   if (!existing) return false;
   db.delete(projectUpdates).where(eq(projectUpdates.id, updateId)).run();
   return true;
}
