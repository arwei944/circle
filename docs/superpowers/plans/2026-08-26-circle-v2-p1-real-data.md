# V2-P1 项目/周期全量真实化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目（列表/详情/活动/属性/健康洞察）与周期（时间线/详情/燃尽图/容量环）从 mock-data 全面切换到真实 SQLite 数据，提供项目与周期的完整 CRUD，进度/燃尽图从真实 issue + `completedAt` 实时计算，团队 overview 读真实团队与项目。

**Architecture:** 延续 V1 统一模式：`db/`(schema/seed/迁移) + `lib/services`(纯函数聚合与 CRUD) + `app/api`(zod+错误信封) + Provider 灌 Store(乐观写回滚) + 页面改读 store。新增 `issues.completedAt` 支撑真实燃尽。

**Tech Stack:** Next.js 15 App Router、Drizzle+better-sqlite3、zod、vitest、`@kayron013/lexorank`、date-fns（已有）、next-intl（已有）。

**Spec:** `docs/superpowers/specs/2026-08-26-circle-v2-p1-projects-cycles-real-data-design.md`

## Global Constraints

- 项目根 `C:\work\test\circle`；分支策略：SDD 时新建 feature 分支；TS strict；路径别名 `@/* → ./*`
- 代码风格：Prettier 3 空格、单引号、100 列；改后 `pnpm exec prettier --write <files>`
- 提交：`git commit --no-verify`（本机 pre-commit 钩子不稳定，见 V1 台账 ruling）
- i18n：新 UI 文案进 `messages/{en,zh}/{projects,cycles,teams,common}.json`（对应命名空间），key 双语一致
- 数据/聚合/CRUD 全部在 service 层（可单测）；路由只做 zod+信封
- **删除语义**：删项目 → `issues.projectId=NULL`；删周期 → `issues.cycleId=''`；不级联删 issue
- **completedAt**：`updateIssue` 内，issue 状态进入 `completed` 类（category==='completed'）时若 `completedAt` 为空则写入 `Date.now()`；离开 completed 不改历史
- 进度/燃尽全部从真实 issues 算，不做手工字段（`projects.percentComplete` 仍存储但不再作为 UI 依据；`cycles.scopeDelta/successRate/burnup` 不落库、由聚合生成）
- 不做：团队 sub-tab、完整活动事件流、健康洞察图表细分、导出/归档/回收站、远程/认证/通知/Agent（V2-P2/P3/B）
- `data/*.db` 已 gitignore；测试用独立 db 文件

---

## 文件结构

```
Modify: db/schema.ts               (新表+新列)
Create: db/migrations/…            (pnpm db:generate 产物)
Modify: db/seed.ts                 (新表/列 seed)
Modify: lib/services/issues-service.ts  (completedAt)
Create: lib/services/projects-service.ts
Create: lib/services/cycles-service.ts
Create: lib/services/teams-service.ts
Create: lib/services/update-meta-service.ts(可选：并入 meta-service 扩展)
Create: lib/compute-burnup.ts      (纯函数，逐日 burnup)
Modify: lib/dto.ts                 (LeanProject/LeanCycle 扩展)
Create: lib/api-projects.ts
Create: lib/api-cycles.ts
Create: lib/api-teams.ts
Create: lib/api-contract.ts (新增 projects/cycles/teams zod schema)
Create: app/api/projects/route.ts
Create: app/api/projects/[id]/route.ts
Create: app/api/projects/[id]/updates/route.ts
Create: app/api/projects/[id]/updates/[updateId]/route.ts
Create: app/api/cycles/route.ts
Create: app/api/cycles/[id]/route.ts
Create: app/api/teams/[teamId]/route.ts
Create: store/projects-store.ts
Create: store/cycles-store.ts
Modify: store/project-updates-store.ts
Create: components/common/projects/projects-data-provider.tsx
Create: components/common/cycles/cycles-data-provider.tsx
Modify: components/layout/main-layout.tsx   (挂载两个 provider)
Modify: components/common/projects/**        (页面接线)
Modify: components/common/cycles/**          (页面接线)
Modify: components/common/teams/team-overview.tsx (团队 overview)
Modify: components/common/issues/...         (mock projects/cycles 引用清扫)
Modify: messages/{en,zh}/projects.json, cycles.json, teams.json, common.json
Modify: README.md
```

---

## Task 1: 数据模型扩展（schema + 迁移 + seed）

**Files:**
- Modify: `db/schema.ts`
- Create: `db/migrations/…`（`pnpm db:generate`）
- Modify: `db/seed.ts`
- Test: `db/v2-schema.test.ts`（新建）

**Interfaces:**
- Produces: `issues.completedAt` 列；`project_updates`、`project_labels`、`teams` 表；`projects.initiative` 列；`cycles.capacity` 列。类型导出 `ProjectUpdateRow/TeamRow` 等
- Consumes: `db/schema.ts` 现有表

- [ ] **Step 1: schema 变更（逐字）**

`db/schema.ts` 增补：

```ts
// issues 表内新增一列（加在 dueDate 后）
completedAt: integer('completed_at'),

// 新表（追加在文件末尾）
export const projectUpdates = sqliteTable('project_updates', {
   id: text('id').primaryKey(),
   projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
   message: text('message').notNull(),
   health: text('health').notNull().default('no-update'),
   authorId: text('author_id'),
   createdAt: integer('created_at').notNull(),
});

export const projectLabels = sqliteTable(
   'project_labels',
   {
      projectId: text('project_id')
         .notNull()
         .references(() => projects.id, { onDelete: 'cascade' }),
      labelId: text('label_id')
         .notNull()
         .references(() => labels.id, { onDelete: 'cascade' }),
   },
   (t) => [primaryKey({ columns: [t.projectId, t.labelId] })]
);

export const teams = sqliteTable('teams', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   icon: text('icon').notNull().default(''),
   color: text('color').notNull().default('#8f9299'),
   joined: integer('joined').notNull().default(1),
});

// projects 表新增一列（加在 targetDate 后）
initiative: text('initiative'),

// cycles 表新增一列（加在 endDate 后）
capacity: integer('capacity').notNull().default(100),
```

- [ ] **Step 2: 生成迁移**

```bash
pnpm db:generate
```

Expected: `db/migrations/0001_*.sql` 含 `ALTER TABLE issues ADD completed_at`、`CREATE TABLE project_updates/project_labels/teams`、`ALTER TABLE projects ADD initiative`、`ALTER TABLE cycles ADD capacity`。

- [ ] **Step 3: seed 扩展（追加到既有事务内）**

`db/seed.ts` 在既有的 users/labels/projects/cycles/issues/issue_labels 之后补：

```ts
db.insert(teams)
   .values(
      (await import('@/mock-data/teams')).teams.map((t) => ({
         id: t.id,
         name: t.name,
         icon: t.icon,
         color: t.color,
         joined: t.joined ? 1 : 0,
      }))
   )
   .run();

// project_labels：按 mock project.labels 关联
const pRows = db.$client.prepare('SELECT id, name FROM projects').all() as { id: string; name: string }[];
const pLabels: { projectId: string; labelId: string }[] = [];
const mockProjects = (await import('@/mock-data/projects')).projects;
for (const p of mockProjects) {
   const pid = pRows.find((r) => r.name === p.name)?.id;
   if (!pid) continue;
   for (const l of p.labels) pLabels.push({ projectId: pid, labelId: l.id });
}
if (pLabels.length > 0) db.insert(projectLabels).values(pLabels).run();
```

> 注：`projects` 表里现有行已含 mock 数据（initiative 来自 mock `p.initiative`），但 seed 幂等哨兵（users>0 跳过）意味着**既有库不会补新列值**。处理：`ensureDb` 后加一个轻量"补齐迁移"（见 Step 4），保证老库也能拿到 `initiative/capacity/teams`。

- [ ] **Step 4: 老库补齐（ensureDb 内）**

`db/client.ts` 的 `ensureDb()` 在迁移后追加幂等补齐（用 sqlite `INSERT OR IGNORE`）：

```ts
// 老库补齐：teams 参考表（幂等）
const teamsStmt = db.$client.prepare('SELECT COUNT(*) AS c FROM teams');
if ((teamsStmt.get() as { c: number }).c === 0) {
   const { teams: mockTeams } = await import('@/mock-data/teams');
   for (const t of mockTeams) {
      db.$client
         .prepare('INSERT OR IGNORE INTO teams (id, name, icon, color, joined) VALUES (?,?,?,?,?)')
         .run(t.id, t.name, t.icon, t.color, t.joined ? 1 : 0);
   }
}
// 老库补齐：projects.initiative / cycles.capacity（已存在值则不动）
db.$client.prepare("UPDATE projects SET initiative = (SELECT i FROM (VALUES ('p5','initiative-1'),('p8','initiative-2')) v(id,i) WHERE v.id = projects.id) WHERE initiative IS NULL").run();
```

> 简化：initiative/capacity 老库补齐可用"从 mock 按 name 匹配回填"，若实现复杂，**至少**保证 `teams` 表填充（团队 overview 依赖）。mock `projects` 的 `initiative` 多为 undefined，补齐可容忍空值。

- [ ] **Step 5: 迁移 + seed + 补齐 测试**

`db/v2-schema.test.ts`：

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
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
   const tables = db.$client
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r: { name: string }) => r.name) as string[];
   expect(tables).toContain('project_updates');
   expect(tables).toContain('project_labels');
   expect(tables).toContain('teams');
});

it('seed fills teams, project_labels; ensureDb backfills legacy db', async () => {
   const db = fresh();
   await runSeed(db);
   const tc = db.$client.prepare('SELECT COUNT(*) AS c FROM teams').get() as { c: number };
   expect(tc.c).toBeGreaterThan(0);
   const plc = db.$client.prepare('SELECT COUNT(*) AS c FROM project_labels').get() as { c: number };
   expect(plc.c).toBeGreaterThan(0);
});
```

- [ ] **Step 6: 运行 + 通过**

```bash
pnpm test -- db/v2-schema.test.ts
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add db/schema.ts db/seed.ts db/client.ts db/v2-schema.test.ts db/migrations
git commit --no-verify -m "feat(db): v2 schema - completedAt, project_updates, project_labels, teams, initiative, capacity"
```
## Task 2: issues-service 的 completedAt 逻辑

**Files:**
- Modify: `lib/services/issues-service.ts`
- Test: `lib/services/issues-service.test.ts`（追加）

**Interfaces:**
- Produces: `updateIssue` 在状态进入 `completed` category 且 `completedAt` 为 NULL 时写入 `Date.now()`；离开 completed 不改。`createIssue` 不影响（新 issue 不可能直接 completed，除非输入 statusId=completed——按 same 规则处理即可）
- Consumes: `mock-data/status` 的 category 判定；`issues.completedAt` 列（Task 1）

- [ ] **Step 1: 追加 failing 测试**

```ts
import { status as statuses } from '@/mock-data/status';
const doneStatus = statuses.find((s) => s.category === 'completed')!;
const startedStatus = statuses.find((s) => s.category === 'started')!;

it('updateIssue stamps completedAt on entering completed and keeps it historically', async () => {
   const db = fresh();
   await runSeed(db);
   const created = createIssue(db, { title: 'x' });
   // started → completed：写入 completedAt
   updateIssue(db, created.id, { statusId: doneStatus.id });
   const row1 = db.$client
      .prepare('SELECT completed_at AS c FROM issues WHERE id = ?')
      .get(created.id) as { c: number | null };
   expect(typeof row1.c).toBe('number');

   // 离开 completed（历史不改）
   updateIssue(db, created.id, { statusId: startedStatus.id });
   const row2 = db.$client
      .prepare('SELECT completed_at AS c FROM issues WHERE id = ?')
      .get(created.id) as { c: number | null };
   expect(row2.c).toBe(row1.c);

   // 再次进入 completed：已存在则不再覆盖
   updateIssue(db, created.id, { statusId: doneStatus.id });
   const row3 = db.$client
      .prepare('SELECT completed_at AS c FROM issues WHERE id = ?')
      .get(created.id) as { c: number | null };
   expect(row3.c).toBe(row1.c);
});
```

- [ ] **Step 2: 运行确认失败**

```bash
pnpm test -- lib/services/issues-service.test.ts
```

- [ ] **Step 3: 实现**

`lib/services/issues-service.ts`：
- 顶部 `import { status as statuses } from '@/mock-data/status';`（服务端只取 `id/category`，不序列化 icon——若担心拖入 React 组件，改用手写常量数组 `COMPLETED_CATEGORY = ['done','shipped']` 的 id 判定，二选一，报告里说明选择）
- `updateIssue` 的 `.set({...})` 内新增：

```ts
completedAt:
   statuses.find((s) => s.id === statusId)?.category === 'completed' && existing.completedAt == null
      ? Date.now()
      : existing.completedAt,
```

> 注意 `createIssue` 也校验 statusId；若 input.statusId 直接为 completed 类，同样写 `completedAt: Date.now()`（保持一致性；测试未覆盖但不冲突）。

- [ ] **Step 4: 通过 + 回归**

```bash
pnpm test -- lib/services/issues-service.test.ts
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/services/issues-service.ts lib/services/issues-service.test.ts
git commit --no-verify -m "feat(api): stamp completedAt on issues entering completed state"
```

---

## Task 3: 项目服务层（聚合 + CRUD + updates）

**Files:**
- Create: `lib/services/projects-service.ts`
- Modify: `lib/dto.ts`（LeanProject 扩展 + LeanProjectUpdate）
- Test: `lib/services/projects-service.test.ts`

**Interfaces:**
- Produces:
  - `LeanProject = { id, name, iconIndex, color, description, statusId, health, priority, leadId, startDate?, targetDate?, percentComplete, teamId, initiative?, labels: LeanLabel[], totalIssues, completedIssues, healthUpdatedAgoDays?, lead? }`
  - `LeanProjectUpdate = { id, projectId, message, health, authorId, createdAt }`
  - `listProjects(db): LeanProject[]`（聚合 percentComplete/healthUpdatedAgoDays）
  - `getProject(db, id): LeanProject | null`
  - `createProject(db, input): LeanProject`
  - `updateProject(db, id, input): LeanProject`
  - `deleteProject(db, id): boolean`（issues.projectId → NULL）
  - `listProjectUpdates(db, projectId): LeanProjectUpdate[]`
  - `createProjectUpdate(db, projectId, {message, health}): LeanProjectUpdate`
  - `deleteProjectUpdate(db, projectId, updateId): boolean`
  - `assertProjectRefs(db, {assigneeId?|leadId?, teamId?, labelIds?})`
- Consumes: `db/schema`、`lib/dto.ts`、`db/seed`（无）、`mock-data/status|priorities`（常量校验，沿用 issues-service 的 VALID 数组）

- [ ] **Step 1: 写 failing 测试**

`lib/services/projects-service.test.ts`：

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { createIssue } from './issues-service';
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
   const p = createProject(db, { name: '新项目', startDate: '2026-01-01', targetDate: '2026-12-31' });
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
```

- [ ] **Step 2: 运行确认失败**

```bash
pnpm test -- lib/services/projects-service.test.ts
```

- [ ] **Step 3: dto 扩展**

`lib/dto.ts` 追加：

```ts
export interface LeanProjectUpdate {
   id: string;
   projectId: string;
   message: string;
   health: string;
   authorId: string | null;
   createdAt: number;
}
```

- [ ] **Step 4: 实现 projects-service.ts**

关键实现（完整代码要点）：

```ts
import { desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@/db/client';
import { issues, projectLabels as projectLabelsTable, projects, projectUpdates, labels as labelsTable } from '@/db/schema';
import type { LeanLabel, LeanProject, LeanProjectUpdate } from '@/lib/dto';
import { toDateString } from '@/lib/dto';
import { status as statuses } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';

const COMPLETED_IDS = statuses.filter((s) => s.category === 'completed').map((s) => s.id);

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

function loadProjectRelations(db: Db, projectRows: (typeof projects.$inferSelect)[]): {
   row: typeof projects.$inferSelect;
   labels: (typeof labelsTable.$inferSelect)[];
   lead: (typeof users.$inferSelect) | null;
}[] {
   // labels: join project_labels → labels（按 projectId 分组）
   // lead: users 表按 leadId 查找
   // returns 与 projectRows 顺序一致的数组
}

function withCounts(db: Db, rows: (typeof projects.$inferSelect)[]): (typeof projects.$inferSelect & {
   totalIssues: number; completedIssues: number; healthUpdatedAgoDays: number | null;
})[] {
   // 一次查 issues 聚合：
   //   SELECT project_id, COUNT(*) AS total, SUM(category='completed') AS done FROM issues GROUP BY project_id
   // 一次查最近 update：SELECT project_id, MAX(created_at) AS m FROM project_updates GROUP BY project_id
   // 用原始 SQL（prepared）避免复杂 join；返回补齐字段的行
}

function toLean(rel: {...}): LeanProject { /* 含 percentComplete 计算 */ }

export function listProjects(db: Db): LeanProject[] { ... select projects → withCounts → loadRelations → toLean，排序 name asc }
export function getProject(db: Db, id: string): LeanProject | null { ... }
export function assertProjectRefs(db: Db, refs: {...}): void { leadId→users、labelIds→labels、teamId→teams }
export function createProject(db: Db, input: CreateProjectInput): LeanProject {
   const statusId = input.statusId ?? 'to-do';
   const priority = input.priority ?? 'no-priority';
   const health = input.health ?? 'no-update';
   // 校验 status/priority/health 合法性
   const id = `proj_${randomUUID()}`;
   db.$client.transaction(() => {
      db.insert(projects).values({ id, name, iconIndex, color, description, statusId, health, priority, leadId, startDate, targetDate, percentComplete: 0, teamId, initiative }).run();
      if (labels?.length) db.insert(projectLabelsTable).values(labels.map((l) => ({ projectId: id, labelId: l }))).run();
   })();
   return getProject(db, id)!;
}
export function updateProject(db: Db, id: string, input: UpdateProjectInput): LeanProject {
   const existing = db.select().from(projects).where(eq(projects.id, id)).get();
   if (!existing) throw new Error(`project not found: ${id}`);
   assertProjectRefs(...);
   db.$client.transaction(() => {
      db.update(projects).set({ /* 各字段，未提供用 existing */ }).where(eq(projects.id, id)).run();
      if (input.labels !== undefined) {
         db.delete(projectLabelsTable).where(eq(projectLabelsTable.projectId, id)).run();
         if (input.labels.length) db.insert(projectLabelsTable).values(...).run();
      }
   })();
   return getProject(db, id)!;
}
export function deleteProject(db: Db, id: string): boolean {
   const existing = db.select().from(projects).where(eq(projects.id, id)).get();
   if (!existing) return false;
   db.$client.transaction(() => {
      db.update(issues).set({ projectId: null }).where(eq(issues.projectId, id)).run();
      db.delete(projectUpdates).where(eq(projectUpdates.projectId, id)).run(); // 或 cascade，二选一，报告说明
      db.delete(projects).where(eq(projects.id, id)).run();
   })();
   return true;
}
export function listProjectUpdates(db, projectId): LeanProjectUpdate[] { select where projectId order createdAt desc }
export function createProjectUpdate(db, projectId, {message, health}): LeanProjectUpdate {
   // 校验 project 存在、health 合法；id=`pu_${randomUUID()}`；createdAt=Date.now()
}
export function deleteProjectUpdate(db, projectId, updateId): boolean { ... }
```

- [ ] **Step 5: 通过 + 回归**

```bash
pnpm test -- lib/services/projects-service.test.ts
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add lib/dto.ts lib/services/projects-service.ts lib/services/projects-service.test.ts
git commit --no-verify -m "feat(api): projects service with aggregates + CRUD + updates"
```
## Task 4: 周期服务层（聚合 + 燃尽 + CRUD）

**Files:**
- Create: `lib/compute-burnup.ts`
- Create: `lib/services/cycles-service.ts`
- Modify: `lib/dto.ts`（LeanCycle）
- Test: `lib/compute-burnup.test.ts`、`lib/services/cycles-service.test.ts`

**Interfaces:**
- Produces:
  - `computeBurnup(db, cycleId, startDate, endDate, scopeIssues): CycleBurnupPoint[]`（纯：由外部传入数据计算，便于单测）
  - `CycleBurnupPoint = { date: string; scope: number; started: number; completed: number; ideal: number }`
  - `LeanCycle = { id, name, teamId, status, startDate, endDate, capacity, scope, started, completed, successRate?, burnup?: CycleBurnupPoint[] }`
  - `listCycles(db): LeanCycle[]`（scope/started/completed/successRate/burnup 从真实 issues 聚合）
  - `getCycle(db, id): LeanCycle | null`
  - `createCycle(db, input): LeanCycle`
  - `updateCycle(db, id, input): LeanCycle`
  - `deleteCycle(db, id): boolean`（issues.cycleId → ''）
- Consumes: `db/schema`、`lib/dto.ts`、`date-fns`（已有）

- [ ] **Step 1: 写纯函数燃尽计算（TDD）**

`lib/compute-burnup.ts` + `lib/compute-burnup.test.ts`：

```ts
// compute-burnup.ts
import { format } from 'date-fns';

export interface BurnupIssueLike {
   createdAt: string;      // 'yyyy-MM-dd'
   completedAt: string | null; // 'yyyy-MM-dd' | null
}

export interface CycleBurnupPoint {
   date: string; // 'yyyy-MM-dd'
   scope: number;
   started: number;
   completed: number;
   ideal: number;
}

export function computeBurnup(
   startDate: string,
   endDate: string,
   issues: BurnupIssueLike[]
): CycleBurnupPoint[] {
   const start = new Date(startDate + 'T00:00:00');
   const end = new Date(endDate + 'T00:00:00');
   const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
   const scopeTotal = issues.length;
   const points: CycleBurnupPoint[] = [];
   for (let i = 0; i <= totalDays; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const date = format(day, 'yyyy-MM-dd');
      const scope = issues.filter((x) => x.createdAt <= date).length;
      const completed = issues.filter((x) => x.completedAt && x.completedAt <= date).length;
      const ideal = Math.round((scopeTotal * (i + 1)) / (totalDays + 1));
      points.push({ date, scope, started: scope - completed, completed, ideal });
   }
   return points;
}
```

测试：空 issues → 每个点 scope/completed=0 且 ideal 递增；跨天 issue → scope 含 createdAt 当日后；completedAt → completed 曲线；`start===end` 时 1 个点。

- [ ] **Step 2: dto 扩展**

`lib/dto.ts` 追加：

```ts
export interface LeanCycle {
   id: string;
   name: string;
   teamId: string;
   status: string;
   startDate: string;
   endDate: string;
   capacity: number;
   scope: number;
   started: number;
   completed: number;
   successRate?: number;
   burnup?: CycleBurnupPoint[];
}
```

（`CycleBurnupPoint` 从 `lib/compute-burnup.ts` import type。）

- [ ] **Step 3: 写 cycles-service**

`lib/services/cycles-service.ts`（关键实现）：

```ts
import { desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Db } from '@/db/client';
import { cycles, issues } from '@/db/schema';
import type { LeanCycle } from '@/lib/dto';
import { computeBurnup } from '@/lib/compute-burnup';
import { status as statuses } from '@/mock-data/status'; // 或手写 COMPLETED_IDS/STARTED_IDS

const COMPLETED_IDS = statuses.filter((s) => s.category === 'completed').map((s) => s.id);
const STARTED_IDS = statuses.filter((s) => s.category === 'started').map((s) => s.id);

export interface CreateCycleInput {
   name: string;
   teamId?: string;
   status?: string; // 'planned'|'upcoming'|'current'|'completed'
   startDate: string; // 'yyyy-MM-dd'
   endDate: string;
   capacity?: number;
}
export interface UpdateCycleInput extends Partial<CreateCycleInput> {}

function stats(db: Db, cycleId: string): {
   scope: number; started: number; completed: number; import Dates: string[]; burnup: CycleBurnupPoint[];
} {
   const rows = db.select({
      createdAt: issues.createdAt,
      statusId: issues.statusId,
      completedAt: issues.completedAt,
   }).from(issues).where(eq(issues.cycleId, cycleId)).all();
   // statusId → category 判定；completedDate = completedAt ? toDateString(completedAt) : null
   const scope = rows.length;
   const completed = rows.filter((r) => COMPLETED_IDS.includes(r.statusId)).length;
   const started = rows.filter((r) => STARTED_IDS.includes(r.statusId)).length;
   const burnup = computeBurnup(startDate, endDate, rows.map((r) => ({
      createdAt: toDateString(r.createdAt),
      completedAt: r.completedAt != null ? toDateString(r.completedAt) : null,
   })));
   return { scope, started, completed, burnup };
}

export function listCycles(db: Db): LeanCycle[] {
   const rows = db.select().from(cycles).orderBy(asc(cycles.startDate)).all(); // startDate 升序 = 时间线顺序
   return rows.map((c) => ({ ...c, capacity: c.capacity, successRate: ..., burnup: (status==='current'||status==='completed') ? stats(...) : undefined, ...stats }));
}
export function getCycle(db, id): LeanCycle | null { ... }
export function createCycle(db, input): LeanCycle { id=`cyc_${randomUUID()}`; 校验 name/startDate<=endDate/status 合法 }
export function updateCycle(db, id, input): LeanCycle { ... }
export function deleteCycle(db, id): boolean { issues.cycleId='' → delete cycle }
```

> `successRate = scope > 0 ? Math.round((completed / scope) * 100) : 0`；`burnup` 仅 `current/completed` 周期返回（planned/upcoming 不必算，前端也不画）。

- [ ] **Step 4: cycles-service 测试**

覆盖：listCycles 聚合数字正确（构造 2 个 issue：一 completed 一带 completedAt）；createCycle 默认值；updateCycle；deleteCycle 解关联（cycleId 变 ''）；bad endDate<startDate 抛错。

- [ ] **Step 5: 通过 + 回归**

```bash
pnpm test -- lib/compute-burnup.test.ts lib/services/cycles-service.test.ts
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add lib/compute-burnup.ts lib/compute-burnup.test.ts lib/services/cycles-service.ts lib/services/cycles-service.test.ts lib/dto.ts
git commit --no-verify -m "feat(api): cycles service with real aggregates + burnup + CRUD"
```

---

## Task 5: API 路由层（projects/cycles/teams）+ 客户端模块

**Files:**
- Modify: `lib/api-contract.ts`（新增 zod schema）
- Create: `app/api/projects/route.ts`、`app/api/projects/[id]/route.ts`、`app/api/projects/[id]/updates/route.ts`、`app/api/projects/[id]/updates/[updateId]/route.ts`
- Create: `app/api/cycles/route.ts`、`app/api/cycles/[id]/route.ts`
- Create: `app/api/teams/[teamId]/route.ts`
- Create: `lib/api-projects.ts`、`lib/api-cycles.ts`、`lib/api-teams.ts`
- Test: `app/api/projects/route.test.ts`（轻：zod 拒绝 + 信封）

**Interfaces:**
- Produces:
  - `GET /api/projects` → `{projects: LeanProject[]}`；`POST /api/projects` → 201 `{project}`
  - `GET/PATCH/DELETE /api/projects/[id]`
  - `POST /api/projects/[id]/updates` → 201 `{update}`；`DELETE /api/projects/[id]/updates/[updateId]` → 204
  - `GET/POST /api/cycles`、`GET/PATCH/DELETE /api/cycles/[id]`
  - `GET /api/teams/[teamId]` → `{ team: {id,name,icon,color,joined}, projects: LeanProject[], cycles: LeanCycle[] }`
  - 客户端：`fetchProjects/createProject/updateProject/deleteProject/createProjectUpdate/deleteProjectUpdate/fetchCycles/createCycle/updateCycle/deleteCycle/fetchTeam`
- Consumes: `projects/cycles/teams` service、`lib/api-contract`（zod）

- [ ] **Step 1: api-contract zod 扩展**

`lib/api-contract.ts` 追加：

```ts
export const createProjectSchema = z.object({
   name: z.string().trim().min(1).max(200),
   iconIndex: z.number().int().min(0).optional(),
   color: z.string().optional(),
   description: z.string().max(4000).optional().default(''),
   statusId: z.string().optional(),
   priority: z.string().optional(),
   health: z.string().optional(),
   leadId: z.string().nullable().optional(),
   startDate: z.string().nullable().optional(),
   targetDate: z.string().nullable().optional(),
   teamId: z.string().optional(),
   initiative: z.string().nullable().optional(),
   labels: z.array(z.string()).optional().default([]),
}).strip();
export const updateProjectSchema = createProjectSchema.partial();
export const createProjectUpdateSchema = z.object({
   message: z.string().trim().min(1).max(4000),
   health: z.string().optional().default('no-update'),
}).strip();

export const createCycleSchema = z.object({
   name: z.string().trim().min(1).max(200),
   teamId: z.string().optional(),
   status: z.enum(['planned', 'upcoming', 'current', 'completed']).optional(),
   startDate: z.string().min(1),
   endDate: z.string().min(1),
   capacity: z.number().int().min(0).max(1000).optional(),
}).strip();
export const updateCycleSchema = createCycleSchema.partial();
```

- [ ] **Step 2: 路由（与 V1 完全同构）**

`app/api/projects/route.ts`：`GET` → `ensureDb(); json({projects: listProjects(getDb())})`；`POST` → `createProjectSchema.safeParse` → 422 ARG / 201 `{project}` / 422 DOMAIN。
`app/api/projects/[id]/route.ts`：`GET` 404/200；`PATCH` `updateProjectSchema` 422/404/200；`DELETE` 404/204。
`app/api/projects/[id]/updates/route.ts`：`POST` `createProjectUpdateSchema` → 若项目不存在 404 → 201 `{update}`。
`app/api/projects/[id]/updates/[updateId]/route.ts`：`DELETE` → 204 / 404。
`app/api/cycles/route.ts`、`app/api/cycles/[id]/route.ts`、`app/api/teams/[teamId]/route.ts`：同构。teams：`ensureDb` → `getTeamOverview(getDb(), teamId)`（见 Task 4/3 基础上新增 teams-service 或用子查询）。

> 若 `teams-service` 未单独建文件，把 `getTeamOverview` 放 `lib/services/teams-service.ts`（Task 6 或本任务顺手建）。

- [ ] **Step 3: 客户端模块**

`lib/api-projects.ts`（纯 ts，相对 fetch，风格同 `lib/api-issues.ts`，含 `class ApiError` 复用——若与 issues 相同错误处理，抽到 `lib/api-client.ts` 共享 base；二选一，报告说明）：

```ts
export const fetchProjects = async () => (await getJson<{ projects: unknown[] }>('/api/projects')).projects;
export const createProject = async (input: Record<string, unknown>) => (await sendJson<{ project: unknown }>('POST', '/api/projects', input)).project;
export const updateProject = async (id: string, patch: Record<string, unknown>) => (await sendJson<{ project: unknown }>('PATCH', `/api/projects/${id}`, patch)).project;
export const deleteProject = async (id: string) => sendJson<void>('DELETE', `/api/projects/${id}`);
export const createProjectUpdate = async (id: string, input: Record<string, unknown>) => (await sendJson<{ update: unknown }>('POST', `/api/projects/${id}/updates`, input)).update;
export const deleteProjectUpdate = async (id: string, updateId: string) => sendJson<void>('DELETE', `/api/projects/${id}/updates/${updateId}`);
```

`lib/api-cycles.ts`、`lib/api-teams.ts` 同构（teams 返回 `{team, projects, cycles}`）。

- [ ] **Step 4: 路由测试（轻）**

`app/api/projects/route.test.ts`：POST 空 name → 422 + `code==='ARG'`；POST 合法 → 201；参考 V1 的 absolute-path dynamic import + 每用例独立 db（`data/test-api-projects-<n>.db`，处理 Windows EPERM）。

- [ ] **Step 5: 通过 + 回归**

```bash
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add lib/api-contract.ts lib/api-projects.ts lib/api-cycles.ts lib/api-teams.ts app/api/projects app/api/cycles app/api/teams app/api/projects/route.test.ts
git commit --no-verify -m "feat(api): projects/cycles/teams route handlers + typed client modules"
```
## Task 6: 前端 Store + Provider 接入

**Files:**
- Create: `store/projects-store.ts`
- Create: `store/cycles-store.ts`
- Modify: `store/project-updates-store.ts`（改为乐观 + api）
- Create: `components/common/projects/projects-data-provider.tsx`
- Create: `components/common/cycles/cycles-data-provider.tsx`
- Modify: `components/layout/main-layout.tsx`（挂载两个 provider）
- Test: `store/projects-store.test.ts`、`store/cycles-store.test.ts`（可合并一个文件）

**Interfaces:**
- Produces:
  - `useProjectsStore`: `{ projects, hydrated, hydrate(projects), createProject(input), updateProject(id, patch), deleteProject(id) }`（乐观 + rollback + notifyError）
  - `useCyclesStore`: 同构 `{ cycles, hydrated, hydrate, createCycle, updateCycle, deleteCycle }`
  - `useProjectUpdatesStore`: 改为 `{ updatesByProject: Record<string, Update[]>, create(projectId, {message,health}), remove(projectId, id) }` 乐观 + api
  - `ProjectsDataProvider`/`CyclesDataProvider`（client，挂载时 `hydrated` 单次拉取）
- Consumes: `lib/api-projects.ts`、`lib/api-cycles.ts`、`lib/api-teams.ts`、`lib/toast.ts`、V1 的 store 模式

- [ ] **Step 1: 写 failing 测试（store 模式同 V1）**

`store/projects-store.test.ts`：vi.mock `@/lib/api-projects` + `@/lib/toast`；用例：hydrate 设置 hydrated；createProject 乐观插入 → resolve 后替换为 server 返回；失败回滚 + notifyError；deleteProject 乐观移除 + 失败回滚。cycles 同构。

- [ ] **Step 2: 实现 projects/cycles store**

```ts
// store/projects-store.ts
'use client'; // store 本身不需要，但被 client 组件用；保持普通 zustand 文件（无 'use client'，参考 issues-store）
import { create } from 'zustand';
import { createProject as apiCreate, updateProject as apiUpdate, deleteProject as apiDelete } from '@/lib/api-projects';
import { notifyError } from '@/lib/toast';

interface ProjectsState {
   projects: LeanProject[];
   hydrated: boolean;
   hydrate: (projects: LeanProject[]) => void;
   createProject: (input: Record<string, unknown>) => Promise<void>;
   updateProject: (id: string, patch: Record<string, unknown>) => Promise<void>;
   deleteProject: (id: string) => Promise<void>;
}
export const useProjectsStore = create<ProjectsState>((set, get) => ({
   projects: [],
   hydrated: false,
   hydrate: (projects) => set({ projects, hydrated: true }),
   createProject: async (input) => {
      const previous = get().projects;
      try {
         const server = await apiCreate(input);
         set((s) => ({ projects: [...s.projects, server], hydrated: true }));
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
   updateProject: async (id, patch) => {
      const previous = get().projects;
      set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      try {
         const server = await apiUpdate(id, patch);
         set((s) => ({ projects: s.projects.map((p) => (p.id === id ? server : p)) }));
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
   deleteProject: async (id) => {
      const previous = get().projects;
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      try {
         await apiDelete(id);
      } catch (e) {
         set({ projects: previous });
         notifyError((e as Error).message);
      }
   },
}));
```

> `LeanProject` 从 `lib/dto.ts` import type；组件端富化（percentComplete 已是数字、labels 已带）直接可用——不需要像 issues 那样重建整个对象（project DTO 就是最终形态；icon 用 `iconIndex` + `PROJECT_ICON_ORDER` 在组件里解析，或用一个小 `ProjectIcon` 组件）。

- [ ] **Step 3: providers**

```tsx
// components/common/projects/projects-data-provider.tsx
'use client';
import { useEffect } from 'react';
import { fetchProjects } from '@/lib/api-projects';
import { useProjectsStore } from '@/store/projects-store';

export function ProjectsDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useProjectsStore((s) => s.hydrated);
   const hydrate = useProjectsStore((s) => s.hydrate);
   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      fetchProjects()
         .then((projects) => !cancelled && hydrate(projects as never))
         .catch(() => {});
      return () => { cancelled = true; };
   }, [hydrated, hydrate]);
   return <>{children}</>;
}
```

`cycles-data-provider.tsx` 同构（fetchCycles）。**挂载**：`main-layout.tsx` 在 `<IssuesDataProvider />` 之后插入两个 provider（各自独立 hydrated，互不依赖）。

- [ ] **Step 4: project-updates-store 改造**

```ts
import { create } from 'zustand';
import { createProjectUpdate as apiCreateUpdate, deleteProjectUpdate as apiDeleteUpdate } from '@/lib/api-projects';
import { notifyError } from '@/lib/toast';

interface ProjectUpdatesState {
   updatesByProject: Record<string, { id: string; projectId: string; message: string; health: string; authorId: string | null; createdAt: number }[]>;
   hydrateForProject: (projectId: string, updates: [...]) => void;
   create: (projectId: string, input: { message: string; health?: string }) => Promise<void>;
   remove: (projectId: string, updateId: string) => Promise<void>;
}
```

写操作乐观 + rollback + notifyError，风格同 projects-store。新增 action `create`/`remove`（保留原字段名映射到组件现有调用点，报告里列出原 store 对外 API 与新的映射）。

- [ ] **Step 5: 通过 + 回归**

```bash
pnpm test -- store/projects-store.test.ts store/cycles-store.test.ts
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add store/projects-store.ts store/cycles-store.ts store/project-updates-store.ts components/common/projects/projects-data-provider.tsx components/common/cycles/cycles-data-provider.tsx components/layout/main-layout.tsx store/*.test.ts
git commit --no-verify -m "feat(ui): projects/cycles stores + data providers + updates store to astra"
```

---

## Task 7: 项目页面接线（列表/洞察/详情/活动/属性/CRUD）

**Files:**
- Modify: `components/common/projects/**`（projects.tsx、project-line.tsx、projects-timeline.tsx、projects-insights-panel.tsx、projects-list.tsx、project-peek-panel.tsx、details/* 等）
- Modify: `components/common/issues/issue-filter-columns.tsx`、`create-new-issue/project-selector.tsx`、`issue-context-menu.tsx`、`project-badge.tsx`（mock projects 清扫）
- Modify: `messages/{en,zh}/projects.json`（新增 CRUD 文案）
- Test: 若可行，`components/common/projects/projects-page.test.tsx`（轻：渲染 store 空态→数据态；不强求）

**Interfaces:**
- Consumes: `useProjectsStore`、`useProjectUpdatesStore`、`lib/api-projects`（不经组件直接调，走 store）
- Produces: 项目页/详情全量真实数据 + CRUD UI

- [ ] **Step 1: 数据源替换（机械，先做）**

把项目相关组件里 `import { projects, getProjectById, ... } from '@/mock-data/projects'` 的**读**替换为 store：

```ts
const { projects } = useProjectsStore();
const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
```

保留 mock 的 `health` 常量数组、`Project` 类型（DTO 已含所需字段）。`getProjectById` → store find。确认每个消费点：`project-line`（健康/优先级/lead/目标日期/进度条）、`projects-timeline`（甘特位置）、`projects-insights-panel`（Health/Teams/Leads 计数）、`details/project-overview`、`details/project-issues`、`details/project-properties-panel`。

- [ ] **Step 2: 保持 URL 筛选/nuqs 不动**

`projects-filter-store`/`projects-display-store` 不变；组件内对 store.projects 的 `useMemo` 筛选逻辑保持。

- [ ] **Step 3: CRUD 对话框**

新增（或复用并接线）：
- 新建项目对话框：name/team(select from teams)/health/priority/lead/startDate/targetDate → `useProjectsStore.createProject`
- 编辑：同上 → `updateProject`；删除按钮 → `deleteProject`（含"删除后问题将取消关联"文案，i18n）
- 周期 CRUD 在 Task 8，本项目不加

组件放 `components/common/projects/project-create-dialog.tsx`、`project-edit-dialog.tsx`（可合并为 `project-form-dialog.tsx`，报告说明）。依赖 `components/ui/*`（dialog/button/select/input）与现有 `date-picker.tsx`。

- [ ] **Step 4: 详情属性面板 + 活动 tab**

- `details/project-properties-panel.tsx`：编辑字段调 `updateProject`；labels 选择器调 `updateProject({labels})`；health/priority 选择器同样
- `details/project-activity.tsx`：发布更新表单（message + health picker）→ `useProjectUpdatesStore.create`；更新列表 → `useProjectUpdatesStore.updatesByProject[id]`；删除 → `.remove`；底部渲染该项目的"issue 创建事件"（从 issues store 里 `projectId===id` 按 createdAt 排，渲染"创建了 XX"），mock 的活动列表移除
- 若 `project-updates-store` 需要 `hydrateForProject`，在 provider 或 activity 组件加载时调用 `fetchProjectUpdates`（新增客户端 api `fetchProjectUpdates(projectId)`，Task 5 的 api-projects 补一个 GET）

- [ ] **Step 5: 文案 i18n**

`messages/en/projects.json`、`zh/projects.json` 新增：`createDialog.*`（标题/名称/占位/保存/取消）、`deleteDialog.*`（确认/文案/解关联提示）、`activity.composerPlaceholder/发布更新/删除`、`empty.*`。双语一一对应。

- [ ] **Step 6: 验证 + 回归**

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

（build 通过 = 组件接线无编译错；运行冒烟放 Task 9。）

- [ ] **Step 7: Commit**

```bash
git add components/common/projects components/common/issues components/layout/sidebar/create-new-issue messages/en/projects.json messages/zh/projects.json
git commit --no-verify -m "feat(ui): project pages wired to real store + CRUD dialogs"
```

---

## Task 8: 周期页面接线 + 团队 overview

**Files:**
- Modify: `components/common/cycles/**`（cycles.tsx、cycle-line.tsx、cycle-burnup-chart.tsx、capacity-ring.tsx、cycle-details-panel.tsx、`components/common/issues/cycle-issues.tsx`）
- Modify: `components/common/teams/team-overview.tsx`
- Modify: `components/common/teams/team-line.tsx`（memo读取 teams 从 store？teams 是参考表——见下）
- Modify: `messages/{en,zh}/cycles.json`、`teams.json`
- Test: 轻渲染（可选）

**Interfaces:**
- Consumes: `useCyclesStore`、`lib/api-teams.ts` 得团队概览
- Produces: 周期时间线/详情/容量环/燃尽图真实化；团队 overview 真实；周期 CRUD 对话框

- [ ] **Step 1: teams 参考数据来源决策**

`teams` 表是参考表（id/name/icon/color/joined）。组件里 `import { teams } from '@/mock-data/teams'` 保留还是换 store？
- **裁决**：新建 `store/teams-store.ts`（或并入 `useProjectsStore` 一个 `useTeamStore`），由 `meta`/`/api/teams` 灌入；sidebar 的团队导航读它。**注意**：V1 未建 teams store，此为新增轻量 store（只读 hydrate，无 CRUD）。团队 overview 直接调 `fetchTeam(teamId)`（promise，非 store）即可，不必全局 store。
  → 决策写入实现：overview 页用 `useEffect` + `fetchTeam(teamId)`；sidebar 团队导航保持读 mock（V2-P1 不扩 sidebar，避免膨胀），报告里说明。

- [ ] **Step 2: 周期页面接线**

`cycles.tsx`（时间线）：读 `useCyclesStore`；容量环/燃尽图数据来自 `LeanCycle.capacity/burnup/scope/started/completed`。`cycle-line.tsx`、`cycle-details-panel.tsx`、`cycle-issues.tsx` 同样换 store。mock `cycles` 导入移除。

- [ ] **Step 3: 周期 CRUD 对话框**

`cycle-create-dialog.tsx`/`cycle-edit-dialog.tsx`：name/team/status/startDate/endDate/capacity → `useCyclesStore.createCycle/updateCycle`；删除 → `deleteCycle`（含"周期内问题将回到无周期"提示，i18n）。按钮入口：周期页 header 或时间线右上，报告说明具体放哪。

- [ ] **Step 4: 团队 overview 真实化**

`team-overview.tsx`：`useEffect` → `fetchTeam(teamId)` → 渲染 `{team, projects, cycles}`。projects 行复用 `ProjectLine`/`project-peek-panel` 组件（传 lean project）。mock teams 的 projects 注入移除。

- [ ] **Step 5: i18n**

`messages/{en,zh}/{cycles,teams}.json` 新增 CRUD/overview 文案，双语一致。

- [ ] **Step 6: 验证 + 回归**

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add components/common/cycles components/common/teams/team-overview.tsx components/common/issues/cycle-issues.tsx messages/en/cycles.json messages/zh/cycles.json messages/en/teams.json messages/zh/teams.json
git commit --no-verify -m "feat(ui): cycles pages wired to real store + team overview real"
```

---

## Task 9: 收尾验证（回归 + 冒烟 + i18n 审计 + README）

**Files:**
- Modify: `README.md`（数据层范围更新：projects/cycles/teams 也已真实化）
- 不改业务代码（除非冒烟暴露问题）

**Interfaces:**
- Produces: 全绿验证记录；README 更新

- [ ] **Step 1: 全量回归**

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm exec prettier --check <本轮改动文件>
pnpm build
```

- [ ] **Step 2: 冒烟（端口 3120，跑完停）**

```bash
pnpm start --port 3120
# GET /api/projects → 200，projects[0].totalIssues 为数字、percentComplete ∈ [0,100]
# GET /api/cycles → 200，burnup 数组（current/completed 周期）
# GET /zh/lndev-ui/projects → 200 HTML
# GET /zh/lndev-ui/team/CORE/overview → 200 HTML
# GET /zh/lndev-ui/team/CORE/cycles → 200 HTML
```

- [ ] **Step 3: 手工/半自动 UI 冒烟（若可行）**

打开 `/zh/lndev-ui/projects`：切换 All/Active、健康洞察、新建项目对话框创建 → 刷新仍在；进入项目详情 → 编辑属性、发布更新、删除更新；进入周期页 → 新建周期、看燃尽图。记录在 report。

- [ ] **Step 4: i18n 审计**

`msg-key-check`：grep 组件里 `t('projects.*')`/`t('cycles.*')`/`t('teams.*')` 新增 key，确认 en/zh 都有（脚本或手工）。

- [ ] **Step 5: README**

在既有「数据层（个人版）」小节追加：`projects/cycles/teams 已真实化（聚合实时计算 + 完整 CRUD + 发布更新持久化）`。

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit --no-verify -m "docs+ops: v2-p1 projects/cycles real-data README + verification"
```

---

## 自检清单（写完计划后逐项核对）

1. **规格覆盖**：Schema扩展(§3)→Task1；completedAt(§3)→Task2；聚合/CRUD(§4)→Task3/4/5；Store/Provider(§5)→Task6；页面(§6)→Task7/8；测试(§7)→各Task；增值§9 零依赖；范围外(§8)未擅自纳入。
2. **占位符**：无 TBD/TODO；每个代码/接线步骤给出具体目标与验收。
3. **类型一致性**：`LeanProject/LeanCycle/LeanProjectUpdate` 在 Task3/4/5/6/7/8 引用一致；store action 签名在 Task6 定义、Task7/8 调用一致；`completedAt` 列名与 Task2/4 一致。
4. **已知取舍**：teams 参考表只有只读 hydrate（overview 页直接 fetch），sidebar 团队导航保持 mock——符合范围收紧；projects-store 富化比 issues 简单（DTO 即用），用 `iconIndex+PROJECT_ICON_ORDER` 在组件解析。