# Circle 个人版真实数据层设计（MVP：问题 + 看板）

- 日期：2026-08-26
- 状态：已确认（待用户审阅）
- 目标仓库：`C:\work\test\circle`（arwei944/circle，next-intl 中文化后）

## 1. 背景与目标

Circle 目前是纯前端模板：所有数据来自 `mock-data/`，增删改在内存（Zustand）内完成，刷新即丢失。本设计将其改造为**个人自用的真实数据应用**，核心目标：

1. 问题（Issues）与看板（Board）的数据真实持久化：创建/编辑/删除/拖拽排序/筛选均可落库。
2. 保留现有前端组件与交互（含本周完成的中文化），改动面最小。
3. 坚持标准开发实践：契约先行（zod 校验、统一错误信封、类型化 DTO）、测试金字塔、乐观更新与回滚。
4. 单进程、零运维、本机可跑、后续可平滑演进。

## 2. 已确认的决策

| 项       | 决策                                              |
| -------- | ------------------------------------------------- |
| 访问方式 | 仅本机 localhost                                  |
| 认证     | 无认证                                            |
| MVP 范围 | 问题 + 看板；其余功能页保持 mock 渲染             |
| 架构     | 方案 A：Next.js 全栈（App Router Route Handlers） |
| ORM      | Drizzle + better-sqlite3                          |
| 数据库   | SQLite（`data/circle.db`）                        |
| 数据来源 | 首次启动自动迁移 + 从现有 mock-data seed          |

## 3. 架构总览

```
┌───────────────────────────────────────────────┐
│  现有前端（组件/布局/i18n 不变）                │
│  读：useIssuesStore（Zustand，仍为 UI 缓存）    │
│  写：store mutation → 乐观更新 + API + 回滚     │
└──────────────────────┬────────────────────────┘
                       │ REST（Route Handlers）
┌──────────────────────▼────────────────────────┐
│  app/api/*  Route Handlers（薄）                │
│    zod 校验 · 统一错误信封 · 类型化 DTO          │
└──────────────────────┬────────────────────────┘
┌──────────────────────▼────────────────────────┐
│  lib/services/*  服务层（纯函数，注入 db）可测   │
└──────────────────────┬────────────────────────┘
┌──────────────────────▼────────────────────────┐
│  db/(schema · client · seed · migrations)      │
│  SQLite: data/circle.db                        │
└───────────────────────────────────────────────┘
```

分层纪律（对齐全局后端规则）：Route Handler 不写业务逻辑，只做参数解析/鉴权占位/编解码；业务在 `lib/services`；数据访问在 `db`。

## 4. 数据模型（Drizzle schema）

约定：主键均为 TEXT（自生成 id，如 `nanoid` 风格），时间用 epoch 毫秒整数。

### 4.1 表结构

```ts
// users —— 个人版 seed 单一用户（id='you'）
users: id, name, email, avatarUrl, timezone

// labels —— 用户可自定
labels: id, name, color

// projects —— 由 mock-data/projects seed
projects: id, name, iconName, color, description, status, health, priority,
          leadId?, startDate?, targetDate?, percentComplete, teamId?

// cycles —— 由 mock-data/cycles seed（最小字段）
cycles: id, name, teamId, status, startDate, endDate

// issues —— 核心
issues: id, identifier UNIQUE, title, description, statusId, priorityId,
        assigneeId?, projectId?, cycleId?, createdAt, dueDate?, rank

// issue_labels —— m2m
issue_labels: issueId, labelId   (联合唯一)
```

### 4.2 关键规则

- **状态/优先级不落库**：作为代码常量（`mock-data/status.tsx`、`priorities.tsx`），它们是工作流配置。issue 存 `statusId/priorityId`，API 服务端 join 进 DTO。**不使用其非序列化的 `icon` 组件字段**。
- **identifier 生成**：前缀常量 `P`，格式 `P-001`（三位零填充）。在事务内 `SELECT MAX(id) WHERE identifier LIKE 'P-%'` 解析序号 + 1，并发安全（个人版可容忍）。
- **rank**：沿用 `@kayron013/lexorank`，存字符串。新问题默认排到最顶（优先级 + 后插入）。移动语义见 §5.4。
- **DTO 对齐现有前端类型**：`GET` 返回的 issue 对象形状 = 现有 `Issue`（含嵌套 `status/priority/assignee/project/labels`）。`project.icon` 为组件、`status.icon`/`priority.icon` 为组件——DTO 中对应字段改用 `iconName`（字符串），由前端 `iconMap` 映射回组件（fallback：lucide `Box` 等）。`users` 的 `role/teamIds/status` 字段 seed 时补齐，保持类型兼容。
- seed 幂等：`labels/projects/cycles/users` 按 id upsert，`issues` 按 identifier 判断是否已存在，空库才灌 mock 数据。

## 5. API 契约

Base：`app/api/`。所有 JSON。错误统一信封：

```json
{ "code": "SYS_/BIZ_/DOMAIN_…", "message": "…", "details": [], "trace_id": "…" }
```

| 端点               | 方法   | 说明                                                                                   |
| ------------------ | ------ | -------------------------------------------------------------------------------------- |
| `/api/issues`      | GET    | 全量 issue（含 rel），按 `rank` 倒序，兼容当前 store 排序                              |
| `/api/issues`      | POST   | 创建；body 见下                                                                        |
| `/api/issues/[id]` | GET    | 单条                                                                                   |
| `/api/issues/[id]` | PATCH  | 局部更新（含 rank 移动）                                                               |
| `/api/issues/[id]` | DELETE | 删除，204                                                                              |
| `/api/meta`        | GET    | `{ statuses, priorities, labels, projects, cycles, users }`，供筛选器/选择器与图标映射 |

### 5.1 POST /api/issues

```json
{
   "title": "必填 string",
   "description": "string?",
   "statusId": "string?",
   "priorityId": "string?",
   "assigneeId": "string|null?",
   "projectId": "string|null?",
   "cycleId": "string|null?",
   "dueDate": "number|null?",
   "labels": ["string(labelId)"],
   "rank": "omit → 默认置顶"
}
```

默认值：`statusId` 缺省为状态常量中 id 为 `backlog` 的工作流首态；`priorityId = 'no-priority'`；`assigneeId = null`；`labels = []`。返回 201 + 创建后的 DTO。

### 5.2 PATCH /api/issues/[id]

`body` 为部分更新（`Partial<…>` 不含嵌套对象），其中：

- `labels?: string[]` —— **全量替换**语义
- `rank?: { beforeIssueId?: string, afterIssueId?: string }` —— 移动语义：
   - 仅 `afterIssueId`：排在该 issue **之后**
   - 仅 `beforeIssueId`：排在该 issue **之前**
   - 同时给出：取 before（更强的约束）；两者缺省无意义，服务端忽略
   - 服务端用 LexoRank 在邻居之间求中位秩；邻居为空时用 LexoRank 的 min/max 边界；`before` 与 `after` 相邻时用正中间值；必要时 rebalance（批量 < 100，简单重排即可）
- 返回 200 + 更新后 DTO

### 5.3 zod 校验

每个 body 一个 schema；未知字段丢弃（`.strip()`）；`statusId/priorityId/projectId/…` 做存在性校验（404/422 式业务错误 `DOMAIN_`）。

### 5.4 前端类型化封装

`lib/api-issues.ts`：`fetchIssues()/fetchIssue(id)/createIssue(input)/updateIssue(id, patch)/deleteIssue(id)/fetchMeta()`，统一 `Content-Type: application/json`，非 2xx 抛 `ApiError{code,message,details}`。

## 6. 前端接入（最小改动）

目标：**不修改任何现有组件**，只新增数据接入层 + 改造 store 的写动作。

### 6.1 数据读取（hydrate）

- 新增 client 组件 `components/common/issues/issues-data-provider.tsx`：
   - 挂载时并行 `fetchIssues()` + `fetchMeta()`
   - 结果写入 `useIssuesStore`：新增 `hydrate(issues)` 动作（重建 `issuesByStatus`）+ `hydrated` 标记
   - `hydrated === true` 则跳过（模块内只拉一次，避免路由切换重复请求）
- 挂载点：`components/layout/main-layout.tsx`（所有页面共用），或仅 issues 相关页。**决定：挂 main-layout**（inbox/项目页也会读 store 里的真实 issues，行为一致；meta 同时供选择器）。
   - main-layout 是 server 组件，直接引入 client 的 provider 即可（同文件已有 client 子组件模式）。

### 6.2 数据写入（乐观更新）

`store/issues-store.ts` 的 9 个 mutation 动作包一层"乐观 + 回滚"：

```ts
const previous = get().issues;      // 快照
set(newState);                       // 乐观
try {
  await updateIssue(id, mappedPatch); // 调 API
} catch (e) {
  set({ issues: previous, issuesByStatus: groupIssuesByStatus(previous) }); // 回滚
  rethrow / 通知 toast
}
```

- 映射：store 动作入参（如 `Status` / `User` / `Project` 对象）→ PATCH 的 `id` 字段
- `addIssue`：本地生成临时 id 先插入（乐观），成功后用服务端 DTO 替换该行并保持 rank 位
- `updateIssueStatus` 等便捷动作复用 `updateIssue` 通道
- 失败统一 `toast.error(t(...))`；**不中断用户**，状态自动回滚
- 新增 `lib/api-issues.ts` 供 store 调用（store 不 import `lib/api`，改由本地模块注入，保持可测：store 测试时 mock `lib/api-issues`）

### 6.3 筛选/选择器

- **不改**：标签/项目/用户/周期/状态/优先级的**引用列表**继续读 mock（seed 与其一致）
- 看图/分组显示逻辑继续作用于 store 里的真实数组
- `use-panel-filter` 等无关

### 6.4 图标映射（iconMap）

- 新增 `components/common/issues/icon-map.tsx`：`{ projectId → iconComponent }`、`statusId→已由常量自带`、`priorityId→已由常量自带`
- provider 拉取 meta 后把 `project.iconName` → 组件补回 store/issue DTO 的 `project.icon` 字段（DTO 补 `icon: <Icon/>`），使现有渲染不感知变化

## 7. 测试计划

| 层                   | 工具                           | 内容                                             |
| -------------------- | ------------------------------ | ------------------------------------------------ |
| db/schema+seed       | vitest + 内存 SQLite           | 建表、seed 幂等、identifier 递增                 |
| lib/services（集成） | vitest + 临时 SQLite 文件      | 列表 join、创建、部分更新、删除、labels 全量替换 |
| rank 算法            | vitest                         | before/after/边界/rebalance 单元                 |
| store（乐观）        | vitest + mock `lib/api-issues` | 成功路径、失败回滚、addIssue 乐观替换            |
| API 层（轻）         | vitest 直接调用 handler 函数   | zod 拒绝非法 body、错误信封形状                  |
| E2E（后置可选）      | Playwright                     | 建→改→拖→删冒烟                                  |

测试数据：`data/test.db` 或 `:memory:`。迁移在测试用 `drizzle.push`（或直接建表）。

## 8. 运行 / 部署 / 数据安全

- 新增 npm scripts：
   - `db:generate`（drizzle-kit generate）
   - `db:migrate`（drizzle-kit migrate）
   - `db:seed`（`tsx db/seed.ts`）
   - `dev` / `build` / `start` 保持
- 首次启动 `ensureDb()`：无库则迁移 + seed（空判断依据 `issues` 表行数）。**决定：用环境变量 `SKIP_SEED=1` 可跳过。**
- `data/` 加入 `.gitignore`
- `scripts/backup.ps1`：复制 `data/circle.db` 为 `data/circle-<timestamp>.db`，保留最近 7 份
- `start-circle.cmd` 不变

## 9. 范围外（明确不做）

- 其余功能页（项目首页/周期/团队/收件箱/评审/智能体/设置）的真实化，保持 mock 渲染
- 认证 / 多用户 / 权限
- 远端部署 / HTTPS / 邮件 / 站外访问
- 历史数据导入（只做 mock→db seed）

## 10. 风险与缓解

| 风险                                  | 缓解                                                |
| ------------------------------------- | --------------------------------------------------- |
| seed 后 mock 引用列表与库不一致       | 引用数据统一从同源 mock seed；额外交集校验测试      |
| 丢 Native 依赖（better-sqlite3）跨机  | 个人本机固定环境；Docker 化列为后续                 |
| 乐观更新回滚在并发下丢失              | 个人版单用户，无并发；store 用「快照恢复」足够      |
| 循环/项目页仍显 mock 造成"数据源分裂" | MVP 明确标注；页面可访问但数据来源不同，README 注明 |

## 11. 依赖清单

- 新增：`drizzle-orm`、`better-sqlite3`、`zod`(已在)、`@types/better-sqlite3`(dev)
- dev：`drizzle-kit`、`tsx`、`vitest`、`@vitest/coverage-v8`(可选)
- 不新增：React Query（store 已是全局缓存，避免冗余）、认证库、其他
