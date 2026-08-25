import { desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { topRankFrom } from '@/lib/rank';
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
