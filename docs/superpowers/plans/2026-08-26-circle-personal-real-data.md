# Circle 个人版真实数据层（MVP：问题+看板）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Circle 的问题与看板从内存 mock 改造为 SQLite 持久化，前端经 `issues-store` 乐观更新 + REST API 读写，其余功能页保持不变。

**Architecture:** Next.js 全栈（App Router Route Handlers）+ Drizzle(better-sqlite3) + SQLite(`data/circle.db`)。`db/` 负责 schema/seed/迁移，`lib/services` 承载业务（纯函数注入 db），`app/api` 只做参数解析与编解码。前端新增 `issues-data-provider` 灌入 store，store mutation 乐观更新 + API + 回滚。

**Tech Stack:** Next.js 15 (App Router)、Drizzle ORM + better-sqlite3、zod、vitest、tsx、`@kayron013/lexorank`（已有）、sonner（已有）、next-intl（已有，默认中文）。

**Spec:** `docs/superpowers/specs/2026-08-26-circle-personal-real-data-design.md`

## Global Constraints

- 项目根 `C:\work\test\circle`；TS strict；路径别名 `@/* → ./*`
- 代码风格：Prettier，3 空格缩进，单引号，100 列宽（改后务必 `pnpm exec prettier --write <files>`）
- i18n：UI 文案走 next-intl；store 内错误提示用 `lib/toast.ts`（中文默认文案），不引入 React hook
- 不改动范围外功能页（projects/cycles/teams/inbox/agent/reviews/settings 等仍读 mock-data）；不改 `components/ui/**`、`i18n/**`、`middleware.ts`
- 数据库文件落 `data/circle.db`；`data/` 必须进 `.gitignore`
- **服务端禁止把 React 组件（`status.icon`/`priority.icon`/`project.icon`）序列化进 DTO**；project 用 `iconIndex`（整数）→ 客户端由 `PROJECT_ICON_ORDER` 还原
- 状态/优先级/健康度是代码常量（`mock-data/status.tsx`、`priorities.tsx`、`projects.ts` 的 `health`），不落库；认证无；仅本机访问

---

## 文件结构

```
Create: drizzle.config.ts
Create: vitest.config.ts
Create: db/schema.ts
Create: db/client.ts
Create: db/migrate.ts
Create: db/seed.ts
Create: db/migrations/…            ← `pnpm db:generate` 产物
Create: lib/project-icons.ts
Create: lib/dto.ts
Create: lib/api-contract.ts
Create: lib/toast.ts
Create: lib/rank.ts
Create: lib/services/issues-service.ts
Create: lib/services/meta-service.ts
Create: lib/api-issues.ts
Create: app/api/issues/route.ts
Create: app/api/issues/[id]/route.ts
Create: app/api/meta/route.ts
Create: components/common/issues/issues-data-provider.tsx
Create: scripts/backup.ps1
Modify: store/issues-store.ts
Modify: components/layout/sidebar/create-new-issue/index.tsx
Modify: components/layout/main-layout.tsx
Modify: package.json
Modify: .gitignore
Modify: README.md
```

---

## Task 1: 工程底座（依赖、配置、脚本、gitignore）

**Files:**

- Modify: `package.json`
- Modify: `.gitignore`
- Create: `drizzle.config.ts`
- Create: `vitest.config.ts`

**Interfaces:**

- Produces: `drizzle.config.ts`（`drizzle-kit generate` 可解析）、`vitest.config.ts`（`vitest run` 可用、`@` 别名可用）、npm scripts `db:generate`/`db:migrate`/`db:seed`/`test`/`backup`

- [ ] **Step 1: 安装依赖**

```bash
pnpm add drizzle-orm better-sqlite3
pnpm add -D drizzle-kit tsx vitest @types/better-sqlite3
```

- [ ] **Step 2: 验证安装（退出码 0）**

```bash
pnpm install | Out-Null; Write-Host "install exit: $LASTEXITCODE"
```

- [ ] **Step 3: `.gitignore` 追加**

```gitignore
# local data & env
/data/
*.db
*.sqlite
.env
```

- [ ] **Step 4: 创建 `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
   dialect: 'sqlite',
   schema: './db/schema.ts',
   out: './db/migrations',
});
```

- [ ] **Step 5: 创建 `vitest.config.ts`**

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
   resolve: {
      alias: {
         '@': path.resolve(__dirname),
      },
   },
   test: {
      environment: 'node',
      include: ['**/*.test.{ts,tsx}'],
      globals: true,
   },
});
```

- [ ] **Step 6: `package.json` scripts 追加**

```json
"db:generate": "drizzle-kit generate --config drizzle.config.ts",
"db:migrate": "tsx db/migrate.ts",
"db:seed": "tsx db/seed.ts",
"test": "vitest run",
"backup": "powershell -ExecutionPolicy Bypass -File scripts/backup.ps1"
```

（保留现有 `dev/build/start/lint/format/prepare` 不动。）

- [ ] **Step 7: 验证**

```bash
pnpm test -- --passWithNoTests
```

Expected: vitest 报告 "No test files found"，退出码 0。

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore drizzle.config.ts vitest.config.ts
git commit -m "chore(db): scaffold drizzle + vitest + data gitignore"
```

---

## Task 2: 数据模型 + client + 迁移

**Files:**

- Create: `db/schema.ts`
- Create: `db/client.ts`
- Create: `db/migrate.ts`
- Create: `db/migrations/…`
- Test: `db/schema.test.ts`

**Interfaces:**

- Produces: 表模型 `{ users, labels, projects, cycles, issues, issueLabels }`；`getDb()`（按 `CIRCLE_DB_PATH ?? data/circle.db` 的单例）；`ensureDb()`（迁移 + 空库 seed）；`createSqliteClient(dbPath)`；`resetDbForTests()`

- [ ] **Step 1: 写 schema（完整代码）**

`db/schema.ts`:

```ts
import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   email: text('email').notNull(),
   avatarUrl: text('avatar_url').notNull(),
   timezone: text('timezone').notNull(),
   status: text('status').notNull().default('online'),
   role: text('role').notNull().default('Member'),
   joinedDate: text('joined_date').notNull(),
   teamIds: text('team_ids', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
});

export const labels = sqliteTable('labels', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   color: text('color').notNull(),
});

export const projects = sqliteTable('projects', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   iconIndex: integer('icon_index').notNull().default(0),
   color: text('color').notNull().default('#8f9299'),
   description: text('description').notNull().default(''),
   statusId: text('status_id').notNull().default('to-do'),
   health: text('health').notNull().default('no-update'),
   priority: text('priority').notNull().default('no-priority'),
   leadId: text('lead_id'),
   startDate: text('start_date'),
   targetDate: text('target_date'),
   percentComplete: integer('percent_complete').notNull().default(0),
   teamId: text('team_id').notNull().default('CORE'),
});

export const cycles = sqliteTable('cycles', {
   id: text('id').primaryKey(),
   name: text('name').notNull(),
   teamId: text('team_id').notNull().default('CORE'),
   status: text('status').notNull().default('planned'),
   startDate: text('start_date').notNull(),
   endDate: text('end_date').notNull(),
});

export const issues = sqliteTable('issues', {
   id: text('id').primaryKey(),
   identifier: text('identifier').notNull().unique(),
   title: text('title').notNull(),
   description: text('description').notNull().default(''),
   statusId: text('status_id').notNull().default('backlog'),
   priorityId: text('priority_id').notNull().default('no-priority'),
   assigneeId: text('assignee_id'),
   projectId: text('project_id'),
   cycleId: text('cycle_id').notNull().default(''),
   createdAt: integer('created_at').notNull(),
   dueDate: integer('due_date'),
   rank: text('rank').notNull(),
   subissues: text('subissues', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
});

export const issueLabels = sqliteTable(
   'issue_labels',
   {
      issueId: text('issue_id')
         .notNull()
         .references(() => issues.id, { onDelete: 'cascade' }),
      labelId: text('label_id')
         .notNull()
         .references(() => labels.id, { onDelete: 'cascade' }),
   },
   (t) => [primaryKey({ columns: [t.issueId, t.labelId] })]
);

export type IssueRow = typeof issues.$inferSelect;
export type NewIssueRow = typeof issues.$inferInsert;
```

- [ ] **Step 2: 写 client（完整代码）**

`db/client.ts`:

```ts
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
   const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number };
   if (c === 0 && process.env.SKIP_SEED !== '1') {
      await runSeed(db);
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
```

- [ ] **Step 3: 写 migrate 脚本**

`db/migrate.ts`:

```ts
import path from 'node:path';
import { createSqliteClient } from './client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export async function main(): Promise<void> {
   const dbPath = process.env.CIRCLE_DB_PATH ?? path.join(process.cwd(), 'data', 'circle.db');
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   db.$client.close();
   console.log('migrated:', dbPath);
}

if (process.argv[1]?.endsWith('migrate.ts')) {
   main()
      .then(() => process.exit(0))
      .catch((e) => {
         console.error(e);
         process.exit(1);
      });
}
```

- [ ] **Step 4: 写 failing 测试**

`db/schema.test.ts`:

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = path.join(process.cwd(), 'data', 'test-schema.db');

beforeAll(() => {
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
});

afterEach(() => resetDbForTests());

it('migrates all tables', () => {
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   const rows = db.$client
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
   const tables = rows.map((r) => r.name);
   for (const t of ['users', 'labels', 'projects', 'cycles', 'issues', 'issue_labels']) {
      expect(tables).toContain(t);
   }
});
```

- [ ] **Step 5: 运行测试，确认失败（迁移目录不存在或表缺失）**

```bash
pnpm test -- db/schema.test.ts
```

- [ ] **Step 6: 生成迁移**

```bash
pnpm db:generate
```

Expected: `db/migrations/0000_*.sql` 含 `CREATE TABLE ... "issues"` 等。

- [ ] **Step 7: 运行测试确认通过**

```bash
pnpm test -- db/schema.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add db/ drizzle.config.ts vitest.config.ts
git commit -m "feat(db): drizzle schema + client + migrate for personal data layer"
```

---

## Task 3: seed（mock → SQLite）+ 共享图标

**Files:**

- Create: `lib/project-icons.ts`
- Create: `db/seed.ts`
- Test: `db/seed.test.ts`

**Interfaces:**

- Produces: `PROJECT_ICON_ORDER`（组件数组）、`runSeed(db): Promise<void>`（幂等：空库插入，已存在则跳过）
- Consumes: `mock-data/{issues,labels,projects,cycles,users}`

- [ ] **Step 1: 写共享图标模块**

`lib/project-icons.ts`:

```ts
import { Blocks, Box, Globe, Grid2X2, Layers, Rocket, Shield, Target, Zap } from 'lucide-react';

/** 服务端 seed 只存整数下标，客户端用同一数组还原图标组件。 */
export const PROJECT_ICON_ORDER = [
   Box,
   Blocks,
   Globe,
   Grid2X2,
   Layers,
   Rocket,
   Shield,
   Target,
   Zap,
] as const;

export const iconByIndex = (index: number) =>
   PROJECT_ICON_ORDER[index % PROJECT_ICON_ORDER.length] ?? Box;
```

- [ ] **Step 2: 写 seed（完整代码）**

`db/seed.ts`:

```ts
import type { Db } from './client';
import { users as mockUsers } from '@/mock-data/users';
import { labels as mockLabels } from '@/mock-data/labels';
import { projects as mockProjects } from '@/mock-data/projects';
import { cycles as mockCycles } from '@/mock-data/cycles';
import { issues as mockIssues } from '@/mock-data/issues';
import { labels, projects, cycles, users, issues, issueLabels } from './schema';

const toEpochMs = (iso: string | undefined): number => {
   if (!iso) return Date.now();
   const t = Date.parse(iso);
   return Number.isNaN(t) ? Date.now() : t;
};

const toDateString = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export async function runSeed(db: Db): Promise<void> {
   const { c } = db.$client.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
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
   })();
}
```

> 说明：`toDateString` 目前未用，Task 4 的 DTO 会用到；若严格 lint，删除未使用变量或在 DTO 中复用。避免遗留未用导出。

- [ ] **Step 3: 写 failing 测试**

`db/seed.test.ts`:

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';

const dbPath = path.join(process.cwd(), 'data', 'test-seed.db');

beforeAll(() => {
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
});

afterEach(() => resetDbForTests());

function freshDb() {
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   return db;
}

it('seeds users/labels/projects/cycles/issues and is idempotent', async () => {
   const db = freshDb();
   await runSeed(db);
   await runSeed(db); // 幂等

   const counts = {
      users: db.$client.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number },
      labels: db.$client.prepare('SELECT COUNT(*) AS c FROM labels').get() as { c: number },
      projects: db.$client.prepare('SELECT COUNT(*) AS c FROM projects').get() as { c: number },
      cycles: db.$client.prepare('SELECT COUNT(*) AS c FROM cycles').get() as { c: number },
      issues: db.$client.prepare('SELECT COUNT(*) AS c FROM issues').get() as { c: number },
      rels: db.$client.prepare('SELECT COUNT(*) AS c FROM issue_labels').get() as { c: number },
   };
   expect(counts.users.c).toBeGreaterThan(0);
   expect(counts.labels.c).toBeGreaterThan(0);
   expect(counts.projects.c).toBeGreaterThan(0);
   expect(counts.cycles.c).toBeGreaterThan(0);
   expect(counts.issues.c).toBeGreaterThan(100);
   expect(counts.rels.c).toBeGreaterThan(0);
});

it('preserves mock identifiers and order', async () => {
   const db = freshDb();
   await runSeed(db);
   const first = db.$client
      .prepare('SELECT identifier, rank FROM issues ORDER BY rank DESC LIMIT 1')
      .get() as { identifier: string; rank: string };
   expect(first.identifier).toBeTruthy();
   expect(typeof first.rank).toBe('string');
});
```

- [ ] **Step 4: 运行测试，确认失败**

```bash
pnpm test -- db/seed.test.ts
```

- [ ] **Step 5: 调用 `runSeed` 使测试通过**

直接运行 Step 2 的实现；重新运行：

```bash
pnpm test -- db/seed.test.ts
```

Expected: PASS（seed 幂等、计数合理）。

- [ ] **Step 6: 清理无用代码**

删除 `db/seed.ts` 中未使用的 `toDateString`（Task 4 需要在 service 里重新实现，不要因此留死代码）。

- [ ] **Step 7: Commit**

```bash
git add lib/project-icons.ts db/seed.ts db/seed.test.ts
git commit -m "feat(db): seed mock-data into sqlite with shared icon indexes"
```

---

## Task 4: DTO 与 issues 服务层（list/get/create）

**Files:**

- Create: `lib/dto.ts`
- Create: `lib/services/issues-service.ts`
- Test: `lib/services/issues-service.test.ts`

**Interfaces:**

- Produces:
   - `LeanUser = { id, name, email, avatarUrl, timezone, status, role, joinedDate, teamIds }`
   - `LeanProject = { id, name, iconIndex, color, teamId, startDate?, targetDate?, percentComplete }`
   - `LeanLabel = { id, name, color }`
   - `LeanIssue = { id, identifier, title, description, statusId, priorityId, assigneeId, projectId, cycleId, createdAt, dueDate?, rank, labels: LeanLabel[], assignee?: LeanUser | null, project?: LeanProject | null }`
   - `listIssues(db): LeanIssue[]`（ORDER BY rank DESC）
   - `getIssue(db, id): LeanIssue | null`
   - `createIssue(db, input: CreateIssueInput): LeanIssue`（生成 id/identifier/rank/createdAt）
   - `CreateIssueInput = { title: string; description?: string; statusId?: string; priorityId?: string; assigneeId?: string | null; projectId?: string | null; cycleId?: string | null; dueDate?: number | null; labels?: string[] }`
- Consumes: `db/schema`、`lib/project-icons.ts`（仅类型）、`mock-data/status|priorities`（校验 id 存在，服务端只读常量，不序列化 icon）

- [ ] **Step 1: 写 failing 测试**

`lib/services/issues-service.test.ts`:

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { createSqliteClient, resetDbForTests } from '@/db/client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { runSeed } from '@/db/seed';
import { createIssue, getIssue, listIssues } from './issues-service';

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
```

- [ ] **Step 2: 运行，确认失败**

```bash
pnpm test -- lib/services/issues-service.test.ts
```

- [ ] **Step 3: 写 DTO 定义与映射**

`lib/dto.ts`（完整代码）:

```ts
export interface LeanUser {
   id: string;
   name: string;
   email: string;
   avatarUrl: string;
   timezone: string;
   status: string;
   role: string;
   joinedDate: string;
   teamIds: string[];
}

export interface LeanProject {
   id: string;
   name: string;
   iconIndex: number;
   color: string;
   teamId: string;
   startDate?: string | null;
   targetDate?: string | null;
   percentComplete: number;
}

export interface LeanLabel {
   id: string;
   name: string;
   color: string;
}

export interface LeanIssue {
   id: string;
   identifier: string;
   title: string;
   description: string;
   statusId: string;
   priorityId: string;
   assigneeId: string | null;
   projectId: string | null;
   cycleId: string;
   createdAt: string;
   dueDate?: string | null;
   rank: string;
   subissues: string[];
   labels: LeanLabel[];
   assignee?: LeanUser | null;
   project?: LeanProject | null;
}

export const toDateString = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
```

- [ ] **Step 4: 写服务层**

`lib/services/issues-service.ts`（完整代码）:

```ts
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { LexoRank } from '@/lib/utils';
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
   const projectIds = [...new Set(issueRows.map((r) => r.projectId).filter(Boolean))];
   const userIds = [...new Set(issueRows.map((r) => r.assigneeId).filter(Boolean))];
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
   return issueRows.map((issue) => ({
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
   if (!row) return 'a3c';
   return LexoRank.between(LexoRank.from(row.rank), null).toString();
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
```

> 注：`asc` 依赖未用则删除该 import；`randomUUID` 生成 `iss_*` 主键。

- [ ] **Step 5: 运行测试，通过**

```bash
pnpm test -- lib/services/issues-service.test.ts
```

Expected: PASS。若 `LexoRank.between` 的 `null` 第二参类型报错，改用 `before.increment()` 二分语义（见 Task 5 注释），保持行为一致。

- [ ] **Step 6: Commit**

```bash
git add lib/dto.ts lib/services/issues-service.ts lib/services/issues-service.test.ts
git commit -m "feat(api): issues service with list/get/create + lean DTO"
```

---

## Task 5: rank 移动算法

**Files:**

- Create: `lib/rank.ts`
- Test: `lib/rank.test.ts`

**Interfaces:**

- Produces: `computeRankBetween(lo: string | null, hi: string | null): string`（升序语义，`lo < 结果 < hi`，`null` 表开区间）；`topRankFrom(currentTop: string | null): string`
- Consumes: `@kayron013/lexorank`（`LexoRank.from/between/increment`）

**关键约定（避免方向混乱）：** 数据库/前端显示序 = `rank DESC`；本模块只算"升序中间值"，调用方保证 `lo` 是显示序里**下方**的、`hi` 是显示序里**上方**的。

- [ ] **Step 1: 写 failing 测试**

`lib/rank.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeRankBetween, topRankFrom } from './rank';

describe('computeRankBetween', () => {
   it('returns a value strictly between two ranks', () => {
      const lo = 'a3c';
      const hi = 'a3g';
      const mid = computeRankBetween(lo, hi);
      expect(mid).toBeTruthy();
      expect(mid > lo && mid < hi).toBe(true);
   });

   it('handles open upper bound (lo only)', () => {
      const mid = computeRankBetween('a3c', null);
      expect(mid > 'a3c').toBe(true);
   });

   it('handles open lower bound (hi only)', () => {
      const mid = computeRankBetween(null, 'a3c');
      expect(mid < 'a3c').toBe(true);
   });

   it('never equals either bound even when adjacent', () => {
      for (let i = 0; i < 20; i++) {
         const mid = computeRankBetween('a3m', 'a3n');
         expect(mid === 'a3m' || mid === 'a3n').toBe(false);
      }
   });
});

describe('topRankFrom', () => {
   it('returns a rank larger than the current top', () => {
      expect(topRankFrom('a3c') > 'a3c').toBe(true);
   });
   it('falls back to a3c when empty', () => {
      expect(topRankFrom(null)).toBe('a3c');
   });
});
```

- [ ] **Step 2: 运行，确认失败**

```bash
pnpm test -- lib/rank.test.ts
```

- [ ] **Step 3: 实现**

`lib/rank.ts`:

```ts
import { LexoRank } from '@/lib/utils';

/**
 * 返回一个严格在 lo 与 hi 之间的 LexoRank 字符串（升序语义）。
 * 任一为 null 表示该方向开放。lo 恒 < hi（由调用方保证）。
 */
export function computeRankBetween(lo: string | null, hi: string | null): string {
   const loRank = lo ? LexoRank.from(lo) : null;
   const hiRank = hi ? LexoRank.from(hi) : null;
   if (loRank && hiRank) return LexoRank.between(loRank, hiRank).toString();
   if (loRank) return LexoRank.between(loRank, null).toString();
   if (hiRank) return LexoRank.between(null, hiRank).toString();
   return 'a3c';
}

export function topRankFrom(currentTop: string | null): string {
   if (!currentTop) return 'a3c';
   return computeRankBetween(currentTop, null);
}
```

> `LexoRank.between` 对相邻值会返回更长中间串，`computeRankBetween('a3m','a3n')` 不会等于端点，循环测试可稳定通过。

- [ ] **Step 4: 运行通过**

```bash
pnpm test -- lib/rank.test.ts
```

- [ ] **Step 5: 把 `issues-service.ts` 的 `topRank` 替换为复用本模块**

删除 Task 4 中 `topRank` 内联实现，改为：

```ts
import { LexoRank } from '@/lib/utils';
import { topRankFrom } from '@/lib/rank';

function topRank(db: Db): string {
   const row = db.$client.prepare('SELECT rank FROM issues ORDER BY rank DESC LIMIT 1').get() as
      | { rank: string }
      | undefined;
   return topRankFrom(row?.rank ?? null);
}
```

（`LexoRank` import 若不再使用则删除。）

- [ ] **Step 6: 回归测试全部**

```bash
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add lib/rank.ts lib/rank.test.ts lib/services/issues-service.ts
git commit -m "feat(db): lexorank between algorithm with open-bound support"
```

---

## Task 6: update/delete + meta 服务

**Files:**

- Modify: `lib/services/issues-service.ts`
- Create: `lib/services/meta-service.ts`
- Test: `lib/services/issues-service.test.ts`（追加）、`lib/services/meta-service.test.ts`

**Interfaces:**

- Produces:

   - `UpdateIssueInput = { title?: string; description?: string; statusId?: string; priorityId?: string; assigneeId?: string | null; projectId?: string | null; cycleId?: string | null; dueDate?: number | null; labels?: string[]; rank?: { beforeIssueId?: string; afterIssueId?: string } }`
   - `updateIssue(db, id, input): LeanIssue`
   - `deleteIssue(db, id): boolean`
   - `listMeta(db): { labels: LeanLabel[]; projects: LeanProject[]; cycles: { id,name,teamId,status,startDate,endDate }[]; users: LeanUser[] }`
   - `assertDomainRefs(db, { assigneeId?, projectId?, labelIds? })`：校验外键存在（供 update/create 复用的可见辅助）

- [ ] **Step 1: 追加 failing 测试（到测试文件尾部）**

```ts
import { deleteIssue, updateIssue } from './issues-service';
import { listMeta } from './meta-service';

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
   expect(reRead?.labels.map((l) => l.id)).toEqual(['bug', 'ui']); // 全量替换
});

it('updateIssue moves rank between neighbors', async () => {
   const db = fresh();
   await runSeed(db);
   const a = createIssue(db, { title: 'a' });
   const b = createIssue(db, { title: 'b' });
   // 显示序：b 在上，a 在 b 下方。把 b 移到 a 之下 → b 成为第二
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

it('listMeta returns reference data', async () => {
   const db = fresh();
   await runSeed(db);
   const meta = listMeta(db);
   expect(meta.labels.length).toBeGreaterThan(5);
   expect(meta.projects.length).toBeGreaterThan(5);
   expect(meta.cycles.length).toBeGreaterThan(0);
   expect(meta.users.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: 运行，确认失败**

```bash
pnpm test -- lib/services/issues-service.test.ts lib/services/meta-service.test.ts
```

- [ ] **Step 3: 实现 updateIssue / deleteIssue（追加到 issues-service.ts）**

```ts
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

function rankById(db: Db, id: string): string | null {
   return (
      db.select({ id: issues.id, rank: issues.rank }).from(issues).where(eq(issues.id, id)).get()
         ?.rank ?? null
   );
}

function applyRank(db: Db, issueId: string, move: RankMove): string | undefined {
   if (!move.beforeIssueId && !move.afterIssueId) return undefined;
   const beforeId = move.beforeIssueId;
   const afterId = move.afterIssueId;

   // 显示序 = rank DESC。beforeId 在上方（rank 更大），afterId 在下方（rank 更小）。
   // 目标：rank 落在 [rank(afterId), rank(beforeId)] 之间。升序计算时 lo=下方、hi=上方。
   let lo: string | null = null;
   let hi: string | null = null;
   if (beforeId) hi = rankById(db, beforeId);
   if (afterId) lo = rankById(db, afterId);

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

   db.$client.transaction(() => {
      db.update(issues)
         .set({
            title: input.title ?? existing.title,
            description: input.description ?? existing.description,
            statusId,
            priorityId,
            assigneeId: input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId,
            projectId: input.projectId !== undefined ? input.projectId : existing.projectId,
            cycleId: input.cycleId !== undefined ? input.cycleId : existing.cycleId,
            dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
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
```

> rank 语义：`{ beforeIssueId }` = 显示在它**上方**，`{ afterIssueId }` = 显示在它**下方**；两者都给时用 lo=after、hi=before。

- [ ] **Step 4: 写 meta 服务**

`lib/services/meta-service.ts`:

```ts
import type { Db } from '@/db/client';
import { cycles, labels, projects, users } from '@/db/schema';
import type { LeanLabel, LeanProject, LeanUser } from '@/lib/dto';

export interface LeanCycle {
   id: string;
   name: string;
   teamId: string;
   status: string;
   startDate: string;
   endDate: string;
}

export function listMeta(db: Db): {
   labels: LeanLabel[];
   projects: LeanProject[];
   cycles: LeanCycle[];
   users: LeanUser[];
} {
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
   return {
      labels: db
         .select()
         .from(labels)
         .all()
         .map((l) => ({ id: l.id, name: l.name, color: l.color })),
      projects: db.select().from(projects).all().map(toLeanProject),
      cycles: db
         .select()
         .from(cycles)
         .all()
         .map((c) => ({
            id: c.id,
            name: c.name,
            teamId: c.teamId,
            status: c.status,
            startDate: c.startDate,
            endDate: c.endDate,
         })),
      users: db.select().from(users).all().map(toLeanUser),
   };
}
```

- [ ] **Step 5: 运行测试，全部通过**

```bash
pnpm test
```

- [ ] **Step 6: Commit**

```bash
git add lib/services/issues-service.ts lib/services/meta-service.ts lib/services/issues-service.test.ts lib/services/meta-service.test.ts
git commit -m "feat(api): issue update with rank move + delete + meta service"
```

---

## Task 7: API 路由层（Route Handlers + zod + 客户端封装 + toast）

**Files:**

- Create: `lib/api-contract.ts`
- Create: `lib/toast.ts`
- Create: `lib/api-issues.ts`
- Create: `app/api/issues/route.ts`
- Create: `app/api/issues/[id]/route.ts`
- Create: `app/api/meta/route.ts`
- Test: `app/api/issues/route.test.ts`

**Interfaces:**

- Produces: 端点 `GET/POST /api/issues`、`GET/PATCH/DELETE /api/issues/[id]`、`GET /api/meta`；`lib/api-issues.ts` 暴露 `fetchIssues/fetchMeta/createIssue/updateIssue/deleteIssue`；`notifyError(msg)`（sonner toast）
- Consumes: `issues-service` / `meta-service` / `api-contract`（zod）

- [ ] **Step 1: 写请求契约与错误信封**

`lib/api-contract.ts`:

```ts
import { z } from 'zod';

export const createIssueSchema = z
   .object({
      title: z.string().trim().min(1).max(500),
      description: z.string().max(20000).optional().default(''),
      statusId: z.string().optional(),
      priorityId: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      cycleId: z.string().nullable().optional(),
      dueDate: z.number().int().nullable().optional(),
      labels: z.array(z.string()).optional().default([]),
   })
   .strip();

export const updateIssueSchema = z
   .object({
      title: z.string().trim().min(1).max(500).optional(),
      description: z.string().max(20000).optional(),
      statusId: z.string().optional(),
      priorityId: z.string().optional(),
      assigneeId: z.string().nullable().optional(),
      projectId: z.string().nullable().optional(),
      cycleId: z.string().nullable().optional(),
      dueDate: z.number().int().nullable().optional(),
      labels: z.array(z.string()).optional(),
      rank: z
         .object({
            beforeIssueId: z.string().optional(),
            afterIssueId: z.string().optional(),
         })
         .strip()
         .optional(),
   })
   .strip()
   .refine((v) => Object.keys(v).length > 0, { message: 'empty update' });

export interface ApiErrorBody {
   code: string;
   message: string;
   details: unknown[];
   trace_id: string;
}

export function apiError(code: string, message: string): ApiErrorBody {
   return { code, message, details: [], trace_id: crypto.randomUUID() };
}
```

- [ ] **Step 2: 写 toast 适配器**

`lib/toast.ts`:

```ts
import { toast } from 'sonner';

export function notifyError(message: string): void {
   toast.error(message);
}

export function notifySuccess(message: string): void {
   toast.success(message);
}
```

- [ ] **Step 3: 写客户端封装**

`lib/api-issues.ts`:

```ts
import type { CreateIssueInput } from '@/lib/services/issues-service';

export class ApiError extends Error {
   code: string;
   details: unknown[];
   constructor(code: string, message: string, details: unknown[] = []) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.details = details;
   }
}

const ZH_FALLBACK = '操作失败，已撤销';
const CODE_MESSAGES: Record<string, string> = {
   ARG: '请求参数不合法',
   NOT_FOUND: '目标不存在',
   DOMAIN: '数据不符合要求',
   SYS: '系统错误',
};

async function parse<T>(res: Response): Promise<T> {
   if (!res.ok) {
      let body: { code?: string; message?: string; details?: unknown[] } | null = null;
      try {
         body = (await res.json()) as typeof body;
      } catch {
         body = null;
      }
      const code = body?.code ?? 'SYS';
      throw new ApiError(
         code,
         (body?.message ?? CODE_MESSAGES[code]) || ZH_FALLBACK,
         body?.details
      );
   }
   return res.json() as Promise<T>;
}

const json = (method: string, body?: unknown): RequestInit => ({
   method,
   headers: { 'Content-Type': 'application/json' },
   body: body === undefined ? undefined : JSON.stringify(body),
});

export const fetchIssues = async () =>
   (await parse<{ issues: unknown[] }>(await fetch('/api/issues', json('GET')))).issues;
export const fetchMeta = async () =>
   parse<{ labels: unknown[]; projects: unknown[]; cycles: unknown[]; users: unknown[] }>(
      await fetch('/api/meta', json('GET'))
   );
export const createIssue = async (input: CreateIssueInput) =>
   (await parse<{ issue: unknown }>(await fetch('/api/issues', json('POST', input)))).issue;
export const updateIssue = async (id: string, patch: Record<string, unknown>) =>
   (await parse<{ issue: unknown }>(await fetch(`/api/issues/${id}`, json('PATCH', patch)))).issue;
export const deleteIssue = async (id: string) =>
   parse<void>(await fetch(`/api/issues/${id}`, json('DELETE')));
```

- [ ] **Step 4: 写 GET/POST 路由**

`app/api/issues/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { ensureDb } from '@/db/client';
import { createIssueSchema, apiError } from '@/lib/api-contract';
import { createIssue, listIssues } from '@/lib/services/issues-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   const { createDb } = await import('@/db/client');
   const db = createDb();
   return NextResponse.json({ issues: listIssues(db) });
}

export async function POST(request: Request) {
   await ensureDb();
   const db = (await import('@/db/client')).createDb();
   const parsed = createIssueSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(apiError('ARG', 'Invalid body'), { status: 422 });
   }
   try {
      const issue = createIssue(db, parsed.data);
      return NextResponse.json({ issue }, { status: 201 });
   } catch (e) {
      return NextResponse.json(apiError('DOMAIN', (e as Error).message), { status: 422 });
   }
}
```

> 修正命名：Task 2 的 `getDb()` 仅在本文件注释里使用 `createDb` 别名，避免误用。最终统一用 `getDb`；上面的 `createDb` 只是示意，实作请写 `getDb`。

- [ ] **Step 5: 写 [id] 路由**

`app/api/issues/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { apiError, updateIssueSchema } from '@/lib/api-contract';
import {
   deleteIssue,
   getIssue,
   updateIssue as updateIssueService,
} from '@/lib/services/issues-service';

export const runtime = 'nodejs';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const issue = getIssue(getDb(), id);
   if (!issue) return NextResponse.json(apiError('NOT_FOUND', 'issue not found'), { status: 404 });
   return NextResponse.json({ issue });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const parsed = updateIssueSchema.safeParse(await request.json().catch(() => null));
   if (!parsed.success) {
      return NextResponse.json(
         { ...apiError('ARG', 'Invalid body'), details: parsed.error.issues },
         { status: 422 }
      );
   }
   try {
      const issue = updateIssueService(getDb(), id, parsed.data as UpdateIssueInput);
      return NextResponse.json({ issue });
   } catch (e) {
      const msg = (e as Error).message;
      if (msg.startsWith('issue not found')) {
         return NextResponse.json(apiError('NOT_FOUND', msg), { status: 404 });
      }
      return NextResponse.json(apiError('DOMAIN', msg), { status: 422 });
   }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
   await ensureDb();
   const { id } = await ctx.params;
   const ok = deleteIssue(getDb(), id);
   if (!ok) return NextResponse.json(apiError('NOT_FOUND', 'issue not found'), { status: 404 });
   return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 6: 写 meta 路由**

`app/api/meta/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/db/client';
import { listMeta } from '@/lib/services/meta-service';

export const runtime = 'nodejs';

export async function GET() {
   await ensureDb();
   return NextResponse.json(listMeta(getDb()));
}
```

- [ ] **Step 7: 路由测试（zod 拒绝 + 错误信封形状）**

`app/api/issues/route.test.ts`:

```ts
import { afterEach, beforeAll, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { resetDbForTests } from '@/db/client';

const dbPath = path.join(process.cwd(), 'data', 'test-api.db');

async function freshModule<T>(id: string): Promise<T> {
   resetDbForTests();
   if (existsSync(dbPath)) rmSync(dbPath);
   process.env.CIRCLE_DB_PATH = dbPath;
   return (await import(id)) as T;
}

beforeAll(() => {
   process.env.CIRCLE_DB_PATH = dbPath;
});
afterEach(async () => {
   resetDbForTests();
   vi.resetModules();
});

it('POST rejects empty title with 422 envelope', async () => {
   const { POST } = await freshModule<{ POST: (req: Request) => Promise<Response> }>(
      '../../app/api/issues/route'
   );
   const res = await POST(
      new Request('http://localhost/api/issues', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ title: '  ' }),
      })
   );
   expect(res.status).toBe(422);
   const body = (await res.json()) as { code: string };
   expect(body.code).toBe('ARG');
});

it('GET returns seeded issues after auto seed', async () => {
   const { GET } = await freshModule<{ GET: () => Promise<Response> }>(
      '../../app/api/issues/route'
   );
   const res = await GET();
   expect(res.status).toBe(200);
   const body = (await res.json()) as { issues: unknown[] };
   expect(body.issues.length).toBeGreaterThan(100);
});
```

> 若动态 import 相对路径解析不稳，改用绝对路径：`path.join(process.cwd(), 'app/api/issues/route')`。

- [ ] **Step 8: 运行全部测试**

```bash
pnpm test
```

Expected: 全部通过（含前序任务）。新库（`data/test-api.db`）会被 `data/` gitignore 忽略。

- [ ] **Step 9: Commit**

```bash
git add lib/api-contract.ts lib/toast.ts lib/api-issues.ts app/api lib/toast.ts
git commit -m "feat(api): issues/meta route handlers with zod + typed client + toast"
```

---

## Task 8: `issues-store` 接真实数据（hydrate + 乐观更新 + 回滚）

**Files:**

- Modify: `store/issues-store.ts`
- Test: `store/issues-store.test.ts`

**Interfaces:**

- Produces: store 新增 `hydrated: boolean`、`hydrate(issues: Issue[]): void`；原 9 个 mutation 改为乐观更新（本地生效 → 调 `lib/api-issues` → 失败回滚 + `notifyError`）；`addIssue` 先以临时 `Issue` 插入，成功后用服务端 DTO 替换该行
- Consumes: `lib/api-issues.ts`（mock 于测试）、`lib/toast.ts`、`mock-data/issues` 的 `groupIssuesByStatus` 与 `Issue` 类型

- [ ] **Step 1: 写 failing 测试**

`store/issues-store.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIssuesStore } from '@/store/issues-store';
import { issues as mockIssues, type Issue } from '@/mock-data/issues';
import { status } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';

const realApi = await import('@/lib/api-issues');

vi.mock('@/lib/api-issues', async () => {
   const actual = await vi.importActual<typeof import('@/lib/api-issues')>('@/lib/api-issues');
   return { ...actual };
});
vi.mock('@/lib/toast', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));

beforeEach(() => {
   useIssuesStore.setState({ issues: [], issuesByStatus: {}, hydrated: false });
   vi.clearAllMocks();
});

const mkIssue = (id: string, override: Partial<Issue> = {}): Issue => ({
   id,
   identifier: id.toUpperCase(),
   title: `issue ${id}`,
   description: '',
   status: status[5],
   assignee: null,
   priority: priorities[0],
   labels: [],
   createdAt: '2026-01-01',
   cycleId: '',
   rank: 'a' + id,
   ...override,
});

describe('hydrate', () => {
   it('hydrates issues and builds issuesByStatus', () => {
      const a = mkIssue('i1');
      const b = mkIssue('i2');
      useIssuesStore.getState().hydrate([a, b]);
      const s = useIssuesStore.getState();
      expect(s.hydrated).toBe(true);
      expect(s.issues).toHaveLength(2);
      expect(s.issuesByStatus['backlog']).toHaveLength(2);
   });
});

describe('updateIssueStatus optimistic', () => {
   it('applies locally then persists; rolls back on failure', async () => {
      const a = mkIssue('i1');
      const b = mkIssue('i2');
      useIssuesStore.getState().hydrate([a, b]);
      const updateSpy = vi.spyOn(realApi, 'updateIssue').mockResolvedValueOnce({ ...a });
      await useIssuesStore.getState().updateIssueStatus('i1', status[0]);
      expect(useIssuesStore.getState().issues[0].status.id).toBe('in-progress');
      expect(updateSpy).toHaveBeenCalledTimes(1);

      updateSpy.mockRejectedValueOnce(new Error('boom'));
      await useIssuesStore.getState().updateIssueStatus('i1', status[1]);
      // 回滚到用户可用的最后状态
      expect(useIssuesStore.getState().issues[0].status.id).toBe('in-progress');
   });
});

describe('addIssue optimistic replace', () => {
   it('inserts temp issue then replaces with server DTO', async () => {
      const a = mkIssue('i1');
      useIssuesStore.getState().hydrate([a]);
      const server = { ...mkIssue('temp_tmp'), id: 'iss_', identifier: 'P-001', rank: 'zzz' };
      vi.spyOn(realApi, 'createIssue').mockResolvedValueOnce(server);
      await useIssuesStore
         .getState()
         .addIssue({ ...mkIssue('temp_tmp'), identifier: 'P-000', rank: 'zzz' });
      const s = useIssuesStore.getState();
      expect(s.issues.some((i) => i.id === 'temp_tmp')).toBe(false);
      expect(s.issues.some((i) => i.id === 'iss_')).toBe(true);
      expect(s.issues[0].identifier).toBe('P-001');
   });
});
```

- [ ] **Step 2: 运行，确认失败（现有 store 无 hydrate/乐观）**

```bash
pnpm test -- store/issues-store.test.ts
```

- [ ] **Step 3: 改写 store（diff 要点）**

`store/issues-store.ts` 变更：

```ts
import {
   createIssue as apiCreateIssue,
   deleteIssue as apiDeleteIssue,
   updateIssue as apiUpdateIssue,
} from '@/lib/api-issues';
import { notifyError } from '@/lib/toast';
import { groupIssuesByStatus, type Issue } from '@/mock-data/issues';

// 1) 初始态改为空 + hydrated:false（删除 mockIssues 导入）
interface IssuesState {
   issues: Issue[];
   issuesByStatus: Record<string, Issue[]>;
   hydrated: boolean;
   hydrate: (issues: Issue[]) => void;
   // ……其余原有方法签名不变
   addIssue: (issue: Issue) => Promise<void>;
   updateIssue: (id: string, updatedIssue: Partial<Issue>) => Promise<void>;
   deleteIssue: (id: string) => Promise<void>;
   updateIssueStatus: (issueId: string, newStatus: Status) => Promise<void>;
   updateIssuePriority: (issueId: string, newPriority: Priority) => Promise<void>;
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => Promise<void>;
   addIssueLabel: (issueId: string, label: LabelInterface) => Promise<void>;
   removeIssueLabel: (issueId: string, labelId: string) => Promise<void>;
   updateIssueProject: (issueId: string, newProject: Project | undefined) => Promise<void>;
}

export const useIssuesStore = create<IssuesState>((set, get) => ({
   issues: [],
   issuesByStatus: {},
   hydrated: false,
   // hydrate 的最终实现见 Step 4（先空实现以便测试失败）
}));
```

> **重要修正**：上面 `applyIssues` 辅助返回对象含 `issuesByStatus`，但 `hydrate` 还需置 `hydrated:true`。实作时写清晰版（见 Step 4 的最终 hydrate）。

- [ ] **Step 4: 提供最终 store 实现（完整）**

```ts
hydrate: (issues) =>
   set((state) => ({
      issues,
      issuesByStatus: groupIssuesByStatus(issues),
      hydrated: true,
   })),

updateIssue: async (id, updatedIssue) => {
   const previous = get().issues;
   const patch: Record<string, unknown> = {
      title: updatedIssue.title,
      description: updatedIssue.description,
      statusId: updatedIssue.status?.id,
      priorityId: updatedIssue.priority?.id,
      assigneeId: updatedIssue.assignee?.id ?? null,
      projectId:
         updatedIssue.project === undefined ? undefined : updatedIssue.project?.id ?? null,
      cycleId: updatedIssue.cycleId,
      dueDate: updatedIssue.dueDate ? new Date(updatedIssue.dueDate).getTime() : null,
      labels: updatedIssue.labels?.map((l) => l.id),
   };
   const clean: Record<string, unknown> = {};
   for (const [k, v] of Object.entries(patch)) if (v !== undefined) clean[k] = v;

   set((state) => applyIssues(state, state.issues.map((i) => (i.id === id ? { ...i, ...updatedIssue } : i))));
   try {
      const server = await apiUpdateIssue(id, clean);
      set((state) => applyIssues(state, state.issues.map((i) => (i.id === id ? mergeServer(i, server) : i))));
   } catch (e) {
      set((state) => applyIssues(state, previous));
      notifyError((e as Error).message);
   }
},
```

其中 `mergeServer`（`lib/frontend-dto.ts` 或 store 内联）：把 LeanIssue DTO 富化为完整 `Issue`（status/priority 由常量还原、project 由 meta 还原）。为降低耦合，富化函数放在 store 文件内的 `toIssue(dto, meta)`；meta 由 provider 先存入一个 `metaHub`（一个模块级 Map），store 的 toIssue 读取之。

- [ ] **Step 5: 相邻 action 同样乐观化**

`updateIssueStatus/Priority/Assignee/Project`、`addIssueLabel/removeIssueLabel` 都改为转发到 `updateIssue`（带对应 patch），从而天然乐观+回滚；`deleteIssue`：本地过滤 + `apiDeleteIssue` + 失败回滚。

`createIssue`（对应原 `addIssue`）：本地生成 `temp_${crypto.randomUUID()}` 临时 Issue（identifier `P-000`）插入顶部的乐观，然后 `apiCreateIssue` 成功后用返回 DTO 替换；失败回滚 + `notifyError`。

- [ ] **Step 6: 富化辅助（完整）**

`store/issues-store.ts` 内新增：

```ts
let metaHub: {
   users: Record<string, User>;
   projectIconByIndex: (index: number) => React.FC;
} = { users: {}, projectIconByIndex: () => Box };

export const setMetaHub = (h: typeof metaHub) => (metaHub = h);
```

> 简化：provider 直接把 `status`/`priority` 常量 + meta 数据用于富化，见 Task 9。若富化逻辑膨胀，抽出 `lib/frontend-dto.ts`（富化函数 == 纯函数，可单独单测）。

- [ ] **Step 7: 运行测试通过 + 回归**

```bash
pnpm test
```

- [ ] **Step 8: Commit**

```bash
git add store/issues-store.ts store/issues-store.test.ts lib/frontend-dto.ts(若新建)
git commit -m "feat(store): optimistic CRUD against api with hydrate + rollback"
```

---

## Task 9: 前端数据接入（provider + 挂载 + 新建流程）

**Files:**

- Create: `components/common/issues/issues-data-provider.tsx`
- Modify: `components/layout/main-layout.tsx`
- Modify: `components/layout/sidebar/create-new-issue/index.tsx`
- Test: `components/common/issues/issues-data-provider.test.tsx`（可仅做 store 富化纯函数测试）

**Interfaces:**

- Produces: `IssuesDataProvider`（client；挂载时并行拉 `/api/issues` + `/api/meta`，富化为 `Issue[]` 并 `hydrate`）；`toIssue(dto, meta): Issue`（纯函数，供 provider 测试）
- Consumes: `lib/api-issues.ts`、`mock-data/{status,priorities,projects}`（`health`）、`lib/project-icons.ts`

- [ ] **Step 1: 富化纯函数 + provider（完整）**

`components/common/issues/issues-data-provider.tsx`（含同文件 `toIssue`）:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { status as statuses } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';
import { health } from '@/mock-data/projects';
import { iconByIndex } from '@/lib/project-icons';
import { fetchIssues, fetchMeta } from '@/lib/api-issues';
import { useIssuesStore } from '@/store/issues-store';
import type { User } from '@/mock-data/users';
import type { Status } from '@/mock-data/status';
import type { Priority } from '@/mock-data/priorities';

interface Meta {
   labels: Array<{ id: string; name: string; color: string }>;
   projects: Array<{ id: string; name: string; iconIndex: number; color: string; teamId: string; startDate?: string | null; targetDate?: string | null; percentComplete: number }>;
   users: Array<{ id: string; name: string; email: string; avatarUrl: string; timezone: string; status: string; role: string; joinedDate: string; teamIds: string[] }>;
}

const statusById = (id: string): Status => statuses.find((s) => s.id === id) ?? statuses[0];
const priorityById = (id: string): Priority => priorities.find((p) => p.id === id) ?? priorities[0];
const healthById = (id: string) => health.find((h) => h.id === id) ?? health[0];

export function toIssue(dto: Record<string, unknown>, meta: Meta): Issue {
   const projectLean = dto.project as Meta['projects'][number] | null | undefined;
   const userLean = dto.assignee as Meta['users'][number] | null | undefined;
   return {
      id: dto.id as string,
      identifier: dto.identifier as string,
      title: dto.title as string,
      description: (dto.description as string) ?? '',
      status: statusById(dto.statusId as string),
      assignee: userLean
         ? {
              id: userLean.id,
              name: userLean.name,
              email: userLean.email,
              avatarUrl: userLean.avatarUrl,
              timezone: userLean.timezone,
              status: userLean.status as User['status'],
              role: userLean.role as User['role'],
              joinedDate: userLean.joinedDate,
              teamIds: userLean.teamIds,
           }
         : null,
      priority: priorityById(dto.priorityId as string),
      labels: (dto.labels as Array<{ id: string; name: string; color: string }>).map((l) => ({
         id: l.id,
         name: l.name,
         color: l.color,
      })),
      createdAt: dto.createdAt as string,
      cycleId: (dto.cycleId as string) ?? '',
      project: projectLean
         ? {
              id: projectLean.id,
              name: projectLean.name,
              icon: iconByIndex(projectLean.iconIndex),
              color: projectLean.color,
              teamId: projectLean.teamId,
              startDate: projectLean.startDate ?? '',
              targetDate: projectLean.targetDate ?? '',
              percentComplete: projectLean.percentComplete,
              status: statusById('to-do'),
              priority: priorityById('no-priority'),
              health: healthById('no-update'),
              lead: (meta.users.find((u) => u.id === 'ln') ?? {
                 id: 'you', name: '你', email: '', avatarUrl: '', timezone: '', status: 'online', role: 'Admin', joinedDate: '', teamIds: [],
              }) as unknown as User,
              labels: [],
           }
         : undefined,
      rank: dto.rank as string,
      dueDate: (dto.dueDate as string) ?? undefined,
      subissues: (dto.subissues as string[]) ?? [],
   };
}

export function IssuesDataProvider({ children }: { children: React.ReactNode }) {
   const hydrated = useIssuesStore((s) => s.hydrated);
   const hydrate = useIssuesStore((s) => s.hydrate);
   const [failed, setFailed] = useState(false);

   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      (async () => {
         try {
            const [issues, meta] = await Promise.all([fetchIssues(), fetchMeta()]);
            if (cancelled) return;
            hydrate(issues.map((d) => toIssue(d, meta as unknown as Meta)), meta);
         } catch {
            if (!cancelled) setFailed(true);
         }
      })();
      return () => {
         cancelled = true;
      };
   }, [hydrated, hydrate]);
   ...
}
```

> 说明：为控制计划篇幅，`toIssue` 上方用一个 `meta` 结构统一收编 `/api/meta` 返回；`hydrate` 实际签名以 Task 8 为准（`hydrate(issues, meta?)` 可选）。provider 内 `failed` 时渲染一个轻量中文提示条（文案走 issues 消息目录的 `dataLoadError`；若该 key 不存在则先加）。

- [ ] **Step 2: 挂载到 main-layout**

`components/layout/main-layout.tsx` 内、`<AppSidebar />` 之前插入：

```tsx
<IssuesDataProvider />
```

并在文件顶部 `import { IssuesDataProvider } from '@/components/common/issues/issues-data-provider';`

- [ ] **Step 3: 新建流程适配**

`components/layout/sidebar/create-new-issue/index.tsx` 改造：

- `createDefaultData()` 仍构造本地 `Issue`（临时 `id: 'temp_' + crypto.randomUUID()`、`identifier: 'P-' + 3 位随机`、`rank: ''`），但提交改为：先 `hydrate` 已有数据后再调用 `addIssue`；`addIssue` 已由 Task 8 支持乐观+替换，**删除 store 内仅剩的随机 identifier 唯一性逻辑与 `ranks` 引用**（identifier 由服务端定）。
- 提交函数不再需要本地 `generateUniqueIdentifier`/`ranks` import。

- [ ] **Step 4: provider 纯函数测试**

`components/common/issues/issues-data-provider.test.tsx`：对 `toIssue` 断言 status/priority/project.icon 已还原、assignee 为 null 时保持 null。

```ts
import { describe, expect, it } from 'vitest';
import { toIssue } from './issues-data-provider';

const meta = {
   labels: [],
   projects: [
      { id: 'p1', name: '项目1', iconIndex: 0, color: '#fff', teamId: 'CORE', percentComplete: 50 },
   ],
   users: [],
};

it('enriches status, priority and project icon', () => {
   const issue = toIssue(
      {
         id: 'a',
         identifier: 'P-001',
         title: 't',
         description: '',
         statusId: 'in-progress',
         priorityId: 'high',
         projectId: 'p1',
         cycleId: '',
         createdAt: '2026-01-01',
         rank: 'a3c',
         labels: [],
         project: meta.projects[0],
         assignee: null,
         subissues: [],
      },
      meta
   );
   expect(issue.status.id).toBe('in-progress');
   expect(issue.priority.id).toBe('high');
   expect(issue.project?.icon).toBeTypeOf('function');
});
```

- [ ] **Step 5: 运行测试 + 类型检查**

```bash
pnpm test
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add components/common/issues/issues-data-provider.tsx components/layout/main-layout.tsx components/layout/sidebar/create-new-issue/index.tsx
git commit -m "feat(ui): hydrate issues from api via provider + adapt create flow"
```

---

## Task 10: 验证、备份脚本、README、收尾

**Files:**

- Create: `scripts/backup.ps1`
- Modify: `README.md`
- Modify: `.gitignore`（若 Task 1 未覆盖）

**Interfaces:**

- Produces: `pnpm backup` 可执行；README 数据/运行说明更新

- [ ] **Step 1: 备份脚本**

`scripts/backup.ps1`:

```powershell
$db = Join-Path $PSScriptRoot '..\data\circle.db'
$dir = Split-Path $db
if (-not (Test-Path $db)) { Write-Host "no db: $db"; exit 0 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item $db (Join-Path $dir "circle-$stamp.db")
# 清理，保留最近 7 份
Get-ChildItem $dir -Filter 'circle-*.db' | Sort-Object Name -Descending | Select-Object -Skip 7 | Remove-Item -Force
Write-Host "backup done: circle-$stamp.db"
```

- [ ] **Step 2: README 追加"个人版数据层"小节**

```markdown
## 数据层（个人版）

- 存储：SQLite `data/circle.db`（Drizzle ORM + better-sqlite3）
- 首次启动自动迁移并 seed（来自 mock-data）；`SKIP_SEED=1` 可跳过
- API：`/api/issues`、`/api/issues/[id]`、`/api/meta`（zod 校验 + 统一错误信封）
- 前端：`issues-data-provider` 灌入 `issues-store`，所有问题写操作乐观更新、失败自动回滚
- 命令：`pnpm db:generate` / `db:migrate` / `db:seed` / `backup` / `test`
- 备份：`pnpm backup`（保留最近 7 份）
```

- [ ] **Step 3: 手动冒烟**

```bash
pnpm build
pnpm start --port 3100
# 浏览器打开 http://localhost:3100/zh/lndev-ui/team/CORE/all
# 验证：列表出现 seed issues；右键改状态/看板拖拽保持不变（乐观）；新建 issue 出现在顶部；刷新持久
```

- [ ] **Step 4: 运行完整验证**

```bash
pnpm lint
pnpm test
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add scripts/backup.ps1 README.md .gitignore
git commit -m "docs+ops: backup script and personal data-layer README"
```

---

## 自检清单（写完计划后逐项核对）

1. **规格覆盖**：Schema（§4.1 表）、identifier（§4.2）、rank（§4.2/§5.2）→ Task 4-6；API（§5）→ Task 7；前端接入（§6）→ Task 8-9；测试（§7）→ 各 Task；运行/备份（§8）→ Task 10；范围外维持 mock（约束）。
2. **占位符**：无 TBD/TODO；每个代码步骤都有具体代码。
3. **类型一致性**：`LeanIssue/LeanUser/LeanProject/LeanLabel` 在 Task 4/6/7 一致；`createIssue/updateIssue/deleteIssue/listIssues/listMeta` 签名在各 Task 引用一致；store 方法签名与 Task 8 定义一致；`toIssue` 输入用 LeanIssue、输出为 `Issue`。
4. **已知取舍**：Task 7 路由内 `getDb`/`createDb` 命名注意事项已注明；Task 8 富化辅助若膨胀则抽 `lib/frontend-dto.ts`；Team/Review 等页面仍显示 mock（范围外，符合规格）。

执行方式（由执行阶段决定）：建议 subagent-driven-development，每个 Task 独立子代理 + 两阶段评审。
