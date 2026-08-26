import { desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { computeRankBetween, topRankFrom } from '@/lib/rank';
import type { Db } from '@/db/client';
import { issues, issueLabels, labels as labelsTable, projects, users } from '@/db/schema';
import type { LeanIssue, LeanLabel, LeanProject, LeanUser } from '@/lib/dto';
import { toDateString } from '@/lib/dto';

const VALID_STATUS = [
   'in-progress',
   'technical-review',
   'done',
   'paused',
   'to-do',
   'backlog',
   'triage',
   'idea',
   'product-feedback',
   'blocked',
   'shipped',
   'canceled',
   'duplicate',
];
const VALID_PRIORITY = ['no-priority', 'urgent', 'high', 'medium', 'low'];
const COMPLETED_IDS = ['done', 'shipped'];

export interface CreateIssueInput {
   title: string;
   description?: string;
   statusId?: string;
   priorityId?: string;
   assigneeId?: string | null;
   projectId?: string | null;
   cycleId?: string | null;
   dueDate?: number | null;
   labels?: string[];
}

type IssueWithRelations = {
   issue: typeof issues.$inferSelect;
   labels: (typeof labelsTable.$inferSelect)[];
   project: typeof projects.$inferSelect | null;
   assignee: typeof users.$inferSelect | null;
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

const toLeanProject = (p: typeof projects.$inferSelect): LeanProject => ({
   id: p.id,
   name: p.name,
   iconIndex: p.iconIndex,
   color: p.color,
   teamId: p.teamId,
   startDate: p.startDate,
   targetDate: p.targetDate,
   percentComplete: p.percentComplete,
});

const toLeanLabel = (l: typeof labelsTable.$inferSelect): LeanLabel => ({
   id: l.id,
   name: l.name,
   color: l.color,
});

function toLeanIssue(x: IssueWithRelations): LeanIssue {
   return {
      id: x.issue.id,
      identifier: x.issue.identifier,
      title: x.issue.title,
      description: x.issue.description,
      statusId: x.issue.statusId,
      priorityId: x.issue.priorityId,
      assigneeId: x.issue.assigneeId,
      projectId: x.issue.projectId,
      cycleId: x.issue.cycleId,
      createdAt: toDateString(x.issue.createdAt),
      dueDate: x.issue.dueDate != null ? toDateString(x.issue.dueDate) : null,
      rank: x.issue.rank,
      subissues: x.issue.subissues,
      labels: x.labels.map(toLeanLabel),
      assignee: x.assignee ? toLeanUser(x.assignee) : null,
      project: x.project ? toLeanProject(x.project) : null,
   };
}

function loadMany(db: Db, ids: string[]): IssueWithRelations[] {
   if (ids.length === 0) return [];
   const issueRows = db.select().from(issues).where(inArray(issues.id, ids)).all();
   const labelRows = db
      .select({ issueId: issueLabels.issueId, label: labelsTable })
      .from(issueLabels)
      .innerJoin(labelsTable, eq(issueLabels.labelId, labelsTable.id))
      .where(inArray(issueLabels.issueId, ids))
      .all();
   const projectIds = [
      ...new Set(issueRows.map((r) => r.projectId).filter((id): id is string => id != null)),
   ];
   const userIds = [
      ...new Set(issueRows.map((r) => r.assigneeId).filter((id): id is string => id != null)),
   ];
   const projectRows =
      projectIds.length > 0
         ? db.select().from(projects).where(inArray(projects.id, projectIds)).all()
         : [];
   const userRows =
      userIds.length > 0 ? db.select().from(users).where(inArray(users.id, userIds)).all() : [];
   const labelMap = new Map<string, (typeof labelsTable.$inferSelect)[]>();
   for (const row of labelRows) {
      const arr = labelMap.get(row.issueId) ?? [];
      arr.push(row.label);
      labelMap.set(row.issueId, arr);
   }
   const projectMap = new Map(projectRows.map((p) => [p.id, p]));
   const userMap = new Map(userRows.map((u) => [u.id, u]));
   const issueById = new Map(issueRows.map((r) => [r.id, r]));
   return ids
      .map((id) => issueById.get(id))
      .filter((issue): issue is typeof issues.$inferSelect => Boolean(issue))
      .map((issue) => ({
         issue,
         labels: labelMap.get(issue.id) ?? [],
         project: issue.projectId ? (projectMap.get(issue.projectId) ?? null) : null,
         assignee: issue.assigneeId ? (userMap.get(issue.assigneeId) ?? null) : null,
      }));
}

function assertValid(statusId: string, priorityId: string): void {
   if (!VALID_STATUS.includes(statusId)) throw new Error(`unknown status: ${statusId}`);
   if (!VALID_PRIORITY.includes(priorityId)) throw new Error(`unknown priority: ${priorityId}`);
}

function nextIdentifier(db: Db): string {
   const row = db.$client
      .prepare(
         "SELECT identifier FROM issues WHERE identifier LIKE 'P-%' ORDER BY identifier DESC LIMIT 1"
      )
      .get() as { identifier: string } | undefined;
   const seq = row ? Number.parseInt(row.identifier.slice(2), 10) + 1 : 1;
   return `P-${String(seq).padStart(3, '0')}`;
}

function topRank(db: Db): string {
   const row = db.$client.prepare('SELECT rank FROM issues ORDER BY rank DESC LIMIT 1').get() as
      | { rank: string }
      | undefined;
   return topRankFrom(row?.rank ?? null);
}

export function listIssues(db: Db): LeanIssue[] {
   const rows = db.select().from(issues).orderBy(desc(issues.rank)).all();
   const withRels = loadMany(
      db,
      rows.map((r) => r.id)
   );
   return withRels.map(toLeanIssue);
}

export function getIssue(db: Db, id: string): LeanIssue | null {
   const issue = db.select().from(issues).where(eq(issues.id, id)).get();
   if (!issue) return null;
   return toLeanIssue(loadMany(db, [issue.id])[0]);
}

export function createIssue(db: Db, input: CreateIssueInput): LeanIssue {
   const statusId = input.statusId ?? 'backlog';
   const priorityId = input.priorityId ?? 'no-priority';
   assertValid(statusId, priorityId);
   if (!input.title.trim()) throw new Error('title required');

   const id = `iss_${randomUUID()}`;
   const identifier = nextIdentifier(db);
   const rank = topRank(db);
   const createdAt = Date.now();

   db.$client.transaction(() => {
      db.insert(issues)
         .values({
            id,
            identifier,
            title: input.title.trim(),
            description: input.description ?? '',
            statusId,
            priorityId,
            assigneeId: input.assigneeId ?? null,
            projectId: input.projectId ?? null,
            cycleId: input.cycleId ?? '',
            createdAt,
            dueDate: input.dueDate ?? null,
            completedAt: COMPLETED_IDS.includes(statusId) ? Date.now() : null,
            rank,
            subissues: [],
         })
         .run();
      const labelIds = [...new Set(input.labels ?? [])];
      if (labelIds.length > 0) {
         db.insert(issueLabels)
            .values(labelIds.map((labelId) => ({ issueId: id, labelId })))
            .run();
      }
   })();

   const created = getIssue(db, id);
   if (!created) throw new Error('create failed');
   return created;
}

export type RankMove = { beforeIssueId?: string; afterIssueId?: string };

export interface UpdateIssueInput {
   title?: string;
   description?: string;
   statusId?: string;
   priorityId?: string;
   assigneeId?: string | null;
   projectId?: string | null;
   cycleId?: string | null;
   dueDate?: number | null;
   labels?: string[];
   rank?: RankMove;
}

export function assertDomainRefs(
   db: Db,
   refs: { assigneeId?: string | null; projectId?: string | null; labelIds?: string[] }
): void {
   if (refs.assigneeId) {
      const u = db.select().from(users).where(eq(users.id, refs.assigneeId)).get();
      if (!u) throw new Error(`unknown assignee: ${refs.assigneeId}`);
   }
   if (refs.projectId) {
      const p = db.select().from(projects).where(eq(projects.id, refs.projectId)).get();
      if (!p) throw new Error(`unknown project: ${refs.projectId}`);
   }
   for (const labelId of refs.labelIds ?? []) {
      const l = db.$client.prepare('SELECT id FROM labels WHERE id = ?').get(labelId);
      if (!l) throw new Error(`unknown label: ${labelId}`);
   }
}

function rankByIssueId(db: Db, id: string): string | null {
   return (
      db.select({ id: issues.id, rank: issues.rank }).from(issues).where(eq(issues.id, id)).get()
         ?.rank ?? null
   );
}

/** 显示序下方紧邻：小于给定 rank 的最大 rank（排除自身，防 moved issue 作为自身边界）。 */
function rankBelow(db: Db, rank: string, excludeId?: string): string | null {
   const row = db.$client
      .prepare(
         excludeId
            ? 'SELECT rank FROM issues WHERE rank < ? AND id != ? ORDER BY rank DESC LIMIT 1'
            : 'SELECT rank FROM issues WHERE rank < ? ORDER BY rank DESC LIMIT 1'
      )
      .get(...(excludeId ? [rank, excludeId] : [rank])) as { rank: string } | undefined;
   return row?.rank ?? null;
}

/** 显示序上方紧邻：大于给定 rank 的最小 rank（排除自身）。 */
function rankAbove(db: Db, rank: string, excludeId?: string): string | null {
   const row = db.$client
      .prepare(
         excludeId
            ? 'SELECT rank FROM issues WHERE rank > ? AND id != ? ORDER BY rank ASC LIMIT 1'
            : 'SELECT rank FROM issues WHERE rank > ? ORDER BY rank ASC LIMIT 1'
      )
      .get(...(excludeId ? [rank, excludeId] : [rank])) as { rank: string } | undefined;
   return row?.rank ?? null;
}

function applyRank(db: Db, issueId: string, move: RankMove): string | undefined {
   const beforeId = move.beforeIssueId;
   const afterId = move.afterIssueId;
   if (!beforeId && !afterId) return undefined;
   if (beforeId === afterId) {
      throw new Error('rank move: before and after are the same issue');
   }

   let lo: string | null = null; // 升序下方（更小 rank）
   let hi: string | null = null; // 升序上方（更大 rank）

   if (beforeId && afterId) {
      // X 落在 after(下) 与 before(上) 之间 → 取双方当前秩
      lo = rankByIssueId(db, afterId);
      hi = rankByIssueId(db, beforeId);
   } else if (beforeId) {
      // X 在 before 上方 → lo=before.rank, hi=before 的上方紧邻
      const bRank = rankByIssueId(db, beforeId);
      lo = bRank;
      hi = bRank ? rankAbove(db, bRank, issueId) : null;
   } else if (afterId) {
      // X 在 after 下方 → hi=after.rank, lo=after 的下方紧邻
      const aRank = rankByIssueId(db, afterId);
      lo = aRank ? rankBelow(db, aRank, issueId) : null;
      hi = aRank;
   }

   if (lo !== null && hi !== null && lo >= hi) {
      throw new Error('rank move: before/after order inverted');
   }
   if (lo === null && hi === null) return undefined;
   const newRank = computeRankBetween(lo, hi);
   db.update(issues).set({ rank: newRank }).where(eq(issues.id, issueId)).run();
   return newRank;
}

export function updateIssue(db: Db, id: string, input: UpdateIssueInput): LeanIssue {
   const existing = db.select().from(issues).where(eq(issues.id, id)).get();
   if (!existing) throw new Error(`issue not found: ${id}`);

   const statusId = input.statusId ?? existing.statusId;
   const priorityId = input.priorityId ?? existing.priorityId;
   assertValid(statusId, priorityId);
   if (
      input.assigneeId !== undefined ||
      input.projectId !== undefined ||
      input.labels !== undefined
   ) {
      assertDomainRefs(db, {
         assigneeId: input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId,
         projectId: input.projectId !== undefined ? input.projectId : existing.projectId,
         labelIds: input.labels,
      });
   }
   if (input.rank) {
      if (input.rank.beforeIssueId && !rankByIssueId(db, input.rank.beforeIssueId)) {
         throw new Error(`unknown before issue: ${input.rank.beforeIssueId}`);
      }
      if (input.rank.afterIssueId && !rankByIssueId(db, input.rank.afterIssueId)) {
         throw new Error(`unknown after issue: ${input.rank.afterIssueId}`);
      }
   }

   db.$client.transaction(() => {
      db.update(issues)
         .set({
            title: input.title ?? existing.title,
            description: input.description ?? existing.description,
            statusId,
            priorityId,
            assigneeId: input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId,
            projectId: input.projectId !== undefined ? input.projectId : existing.projectId,
            cycleId: input.cycleId !== undefined ? (input.cycleId ?? '') : existing.cycleId,
            dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
            completedAt:
               COMPLETED_IDS.includes(statusId) && existing.completedAt == null
                  ? Date.now()
                  : existing.completedAt,
         })
         .where(eq(issues.id, id))
         .run();

      if (input.labels !== undefined) {
         db.delete(issueLabels).where(eq(issueLabels.issueId, id)).run();
         const labelIds = [...new Set(input.labels)];
         if (labelIds.length > 0) {
            db.insert(issueLabels)
               .values(labelIds.map((labelId) => ({ issueId: id, labelId })))
               .run();
         }
      }

      if (input.rank) applyRank(db, id, input.rank);
   })();

   const updated = getIssue(db, id);
   if (!updated) throw new Error('update failed');
   return updated;
}

export function deleteIssue(db: Db, id: string): boolean {
   const existing = db.select().from(issues).where(eq(issues.id, id)).get();
   if (!existing) return false;
   db.$client.transaction(() => {
      db.delete(issueLabels).where(eq(issueLabels.issueId, id)).run();
      db.delete(issues).where(eq(issues.id, id)).run();
   })();
   return true;
}
