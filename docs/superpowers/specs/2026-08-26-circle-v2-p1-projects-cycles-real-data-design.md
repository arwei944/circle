# Circle V2-P1 设计：项目 / 周期全量真实化

- 日期：2026-08-26
- 状态：已确认（待用户审阅）
- 依赖：V1 数据层（`docs/superpowers/specs/2026-08-26-circle-personal-real-data-design.md`）已交付并合并

## 1. 背景与目标

V1 打通了 Issues + 看板（Kanban）的真实持久化（SQLite / Drizzle / Next.js 全栈），`projects`、`cycles`、`users` 表已建并 seed，issue 已有 `projectId/cycleId` 关联。但**项目与周期的 UI 仍读 mock-data**：列表、详情、活动、燃尽图、健康洞察面板、团队 overview 全部是假数据。

V2-P1（子项目一）将**项目 / 周期体系全量真实化**：页面全部接真实数据，进度与燃尽图从真实 issue 实时计算，并提供项目与周期的**完整 CRUD**（新建/编辑/删除）与真实「发布更新」持久化。

架构沿用 V1 已验证的统一模式：**Provider 灌 Store + 乐观写回滚 + /api 路由 + service 纯函数层**。

## 2. 已确认的决策（V2 总体）

| 项 | 决策 |
|---|---|
| 首个立项 | V2-P1：项目/周期真实化 |
| LLM（V2-P3 用） | DeepSeek（openai 兼容端点），本版仅记录，不实现 |
| 通知（V2-P2 用） | 站内收件箱 + 系统通知，本版仅记录，不实现 |
| V2-B 远程/多端 | 暂缓，本版不做 |
| 数据接入架构 | 方案 A：Provider+Store 统一模式（延续 issues 模式） |
| 进度/燃尽来源 | 从真实 issues + `completedAt` 计算 |
| CRUD | 项目与周期均完整 CRUD；删除 = 解除 issue 关联，不级联删 |

## 3. 数据模型扩展（迁移）

基于 V1 已建 `users / labels / projects / cycles / issues / issue_labels`。

| 对象 | 变更 | 说明 |
|---|---|---|
| `issues` | 加列 `completedAt`（INTEGER, nullable） | 进入 `completed` 类状态时写入一次（epoch ms）；离开 completed 不改历史（保留"何时完成"）。用于燃尽图逐日完成量 |
| `project_updates`（新表） | `id`(TEXT PK)、`projectId`(TEXT FK projects.id, cascade)、`message`(TEXT NOT NULL)、`health`(TEXT NOT NULL, 取 'no-update'\|'on-track'\|'at-risk'\|'off-track')、`authorId`(TEXT)、`createdAt`(INTEGER NOT NULL) | 真实「发布更新」记录 |
| `projects` | 加列 `initiative`（TEXT, nullable） | 承接 mock 的 `Project.initiative` |
| `project_labels`（新表） | `projectId`(TEXT)、`labelId`(TEXT)，联合主键，双 FK cascade | 项目标签 m2m |
| `cycles` | 加列 `capacity`（INTEGER default 100） | 容量环；`number` 由序号生成，不入库 |
| `teams`（新表） | `id`(TEXT PK)、`name`(TEXT NOT NULL)、`icon`(TEXT)、`color`(TEXT)、`joined`(INTEGER 0/1 default 1) | 最小团队参考表；团队 overview/导航读真实 |

**删除语义（解关联，不级联删 issue）：**
- 删除项目 → 该项目下所有 `issues.projectId` 置 NULL
- 删除周期 → 该周期下所有 `issues.cycleId` 置 ''

**Seed 扩展：** `db/seed.ts` 在既有基础之上：补 `project_updates`（可为空）、`project_labels`（映射 mock project.labels）、`projects.initiative`、`cycles.capacity`、`teams`。seed 仍幂等（以既有哨兵为准，新表在全新库才写）。

## 4. API 契约（聚合 + CRUD）

沿用 `/api/*` + zod + 统一错误信封 `{code,message,details[],trace_id}`，`runtime='nodejs'`。

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/projects` | GET | 全量项目，每条服务端实时聚合：`totalIssues/completedIssues/percentComplete(真)/healthUpdatedAgoDays(取该项目最近 update.createdAt)/lead/labels/initiative` |
| `/api/projects` | POST | 新建：`{ name, iconIndex?, color?, description?, statusId?, priority?, health?, leadId?, startDate?, targetDate?, teamId?, initiative?, labels? }` → 201 `{project}` |
| `/api/projects/[id]` | GET / PATCH / DELETE | 详情 / 局部更新 / 删除（解关联） |
| `/api/projects/[id]/updates` | POST | 发布更新：`{ message, health }` → 201 `{update}` |
| `/api/projects/[id]/updates/[updateId]` | DELETE | 删除单条更新（活动页可撤销误发） → 204 |
| `/api/cycles` | GET / POST | 列表（含聚合）/ 新建 `{ name, teamId?, status?, startDate, endDate, capacity? }` |
| `/api/cycles/[id]` | GET / PATCH / DELETE | 详情 / 更新 / 删除（解关联） |
| `/api/teams/[teamId]` | GET | 团队信息 + 其真实 projects（列表）+ cycles（列表） |

**聚合计算规则（service 层，可单测）：**
- `percentComplete` = 该项目下 `category==='completed'` 的 issue 数 / 该项目全部 issue 数（0 个 issue 时 0）
- 周期：`scope`=周期内 issue 数；`started`=`category==='started'`；`completed`=`category==='completed'`；`successRate`=completed/scope
- **burnup[]**：按周期 `startDate..endDate` 逐日生成点：`scope(t)`=createdAt≤t 的周期内 issue 累计；`completed(t)`=completedAt≤t 的累计；`ideal`=按 scope 斜率；取每日快照（最多 366 天，超出截断到首尾）

## 5. Provider / Store 接入

延续 `issues-data-provider` 模式：

- 新增 `store/projects-store.ts`、`store/cycles-store.ts`（Zustand）：持有 lean 聚合列表 + `hydrated` + `hydrate()`；写操作乐观更新 → `lib/api-issues` 同风格的 `lib/api-projects.ts`/`lib/api-cycles.ts`（fetch/list/create/update/delete + updates）→ 失败回滚 + `notifyError`
- `store/project-updates-store.ts` 改为乐观 + `/api/projects/[id]/updates`
- 新增 `components/common/projects/projects-data-provider.tsx`、`components/common/cycles/cycles-data-provider.tsx`（client，挂 `main-layout`，`hydrated` 单次拉取）
- 页面改读 store：`import { projects } from '@/mock-data/projects'` → `useProjectsStore(...)`；显示预置对象（status/priority/health 常量、icon 映射）走 V1 的 `lib/frontend-dto.ts` 富化模式
- nuqs 的 URL 筛选/排序**不改**，继续作用于 store 数组

## 6. 页面接线（全量）

| 页面 | 改动 |
|---|---|
| 项目页（All 表格 + Active 时间线 + 健康洞察面板） | 数据源 → store；`percentComplete/health/filter` 用真值 |
| 项目详情-概览 | 真 description/progress/initiative/labels/properties |
| 项目详情-活动 | 真实 `project_updates` 列表 + 该 issue 创建事件（issue 历史变更需事件表 → deferral）；发布更新写真实 |
| 项目详情-问题 | 项目内真实 issue 聚合（复用 issues store） |
| 项目详情-属性面板 | 真编辑（名称/状态/优先级/lead/时间/health/initiative/labels） |
| 周期页 / 周期详情 / 容量环 / 燃尽图 | 数据源 → cycles store；图表用聚合真值 |
| 团队 overview | 真实团队 + 其真实 projects/cycles |
| CRUD 对话框 | 项目与周期 新建/编辑/删除（解关联提示文案），复用现有 dialog/select/date-picker |
| i18n | 新增文案进 en/zh 消息目录（projects/cycles/teams 命名空间） |

## 7. 测试

- 迁移测试：新表/新列存在、FK cascade
- service 单测：`percentComplete`（空项目、全完成、混合）；burnup 逐日（跨天、无 completedAt、空周期）；CRUD 解关联（删项目置 NULL、删周期置 ''）；updates 持久化/按项目过滤
- store：乐观成功/失败回滚（mock api-*.ts）；provider 富化
- API 路由：zod 拒绝、错误信封、404/409
- 回归：既有 29 测试全绿 + `tsc --noEmit` 0 + `pnpm build` 通过
- 冒烟：`/api/projects`、`/api/cycles` 返回真实聚合；页面渲染真实数据

## 8. 范围外（明确不做，V2-P2/后续）

- 团队 sub-tab（members/documents）真实化
- 项目完整「活动事件流」（issue 状态/分配历史变更需 events 表）
- 健康洞察面板的图表细分/趋势
- 导出 / 归档 / 回收站
- 远程/多端、认证、通知、AI Agent（V2-P2/P3/V2-B）
- 列表虚拟化、E2E Playwright、CI（V2-C）

## 9. 依赖

不新增运行时依赖（沿用 V1 栈）。迁移用 drizzle-kit（已有 `pnpm db:generate`）。