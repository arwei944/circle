# Circle —— 项目交接文档

> 生成：2026-08-27 · 分支 `master` · HEAD `aaf1707` · 224 commits · 80 tests 全绿
> 用途：给后续维护者/开发者的完整上下文。建议先读本文，再读 `docs/superpowers/specs/` 的两份设计文档。

---

## 1. 这是什么

**Circle**：受 Linear 启发的项目管理界面（原生为开源 UI 模板 `ln-dev7/circle`）。本项目在其之上，逐步把它改造成**个人自用的真实数据应用**（SQLite 全栈），并中文化。

当前能力边界（真数据 / mock 数据见下表）：**Issues+看板、项目、周期、团队 overview** 已真实化；其余（inbox/文档/reviews/initiatives/views/agent/settings 大部分）仍渲染 mock 数据，是后续迭代对象。

### 数据真实化进度

| 域 | 状态 |
|---|---|
| Issues + 看板（列表/详情/筛选/分组/拖拽改状态/新建） | ✅ 真实（V1） |
| 项目（列表/详情/活动/属性/健康洞察/完整 CRUD/发布更新持久化） | ✅ 真实（V2-P1） |
| 周期（时间线/详情/容量环/燃尽图/完整 CRUD） | ✅ 真实（V2-P1），燃尽从真实 issue + `completedAt` 实时计算 |
| 团队 overview（真实团队 + 其项目/周期） | ✅ 真实（V2-P1） |
| 收件箱 / 文档 / 评审 / Initiatives / Views / Agent / 设置 | ⬜ mock（后续迭代） |

---

## 2. 技术栈与架构

```
┌──────────────────────────────────────────────┐
│  Web 前端：Next.js 15 (App Router, React 19)  │
│  + Tailwind CSS v4 + shadcn/ui + next-intl    │
│  + Zustand(store) + nuqs(URL 状态) + react-dnd│
└──────────────┬───────────────────────────────┘
               │ REST（/api/* Route Handlers）
┌──────────────▼──────────────────────────────┐
│  lib/services/* 服务层（纯函数，注入 Db）     │
│  zod 校验 + 统一错误信封 {code,message,      │
│  details[],trace_id}                         │
└──────────────┬──────────────────────────────┘
┌──────────────▼──────────────────────────────┐
│  db/（Drizzle ORM + better-sqlite3）         │
│  SQLite 文件：data/circle.db（WAL）          │
│  版本化迁移 db/migrations/ + seed            │
└─────────────────────────────────────────────┘
```

- **多语言**：next-intl，默认 `zh`、`/en` 可切换；消息目录 `messages/{en,zh}/*.json`（按功能命名空间）。
- **个人版定位**：单用户·仅本机·无认证。数据文件 `data/circle.db`，进 `.gitignore`。
- **前端状态模式（一致套路）**：`store/*-store.ts`(Zustand 乐观写+失败回滚+notifyError) + `components/*-data-provider.tsx`(hydrated 单次拉取) + 页面从 store 读。示例：`issues-store.ts`、`projects-store.ts`、`cycles-store.ts`、`project-updates-store.ts`。

---

## 3. 怎么跑

```bash
pnpm install          # 首次
pnpm build            # 生产构建（Next15 build = 类型+lint 门禁）
pnpm start --port 3100   # 生产服务
pnpm dev --port 3100     # 开发（Turbopack，本机极慢，不建议个人用）
```

- 首次启动 `ensureDb()` 自动迁移 + 空库 seed（291 issues / 20 projects / 8 cycles）；`SKIP_SEED=1` 跳过。
- 访问 `http://localhost:3100`（默认 `/zh`）。

### 桌面启动（本机 Windows 环境）

| 文件 | 作用 |
|---|---|
| `start-circle.cmd` + `scripts/circle-launch.vbs` | 桌面「Circle」快捷方式入口：wscript 无控制台执行 |
| `scripts/ensure-server.ps1` | 端口 3100 未占用则隐藏拉起 `pnpm start`（无控制台） |
| `scripts/open-app-window.ps1` | 轮询就绪后以 Chrome `--app=` 独立窗口打开 |
| 计划任务 `CircleAppServer`（登录自启） | 登录自动预热服务器 → 点击秒开 |
| `scripts/backup.ps1`（`pnpm backup`） | `VACUUM INTO` 一致快照，保留最近 7 份 |

---

## 4. 数据模型（`db/schema.ts`）

| 表 | 关键字段 |
|---|---|
| `users` | id, name, email, avatarUrl, timezone, status, role, joinedDate, teamIds |
| `teams` | id, name, icon, color, joined（参考表） |
| `labels` | id, name, color |
| `projects` | id, name, iconIndex, color, description, statusId, health, priority, leadId, startDate, targetDate, initiative, percentComplete*, teamId |
| `project_labels` | (projectId, labelId) 联合 PK，双 FK cascade |
| `project_updates` | id, projectId(FK cascade), message, health, authorId, createdAt |
| `cycles` | id, name, teamId, status, startDate, endDate, capacity |
| `issues` | id, identifier UNIQUE, title, description, statusId, priorityId, assigneeId, projectId, cycleId, createdAt, dueDate, **completedAt**, rank(LexoRank), subissues |
| `issue_labels` | (issueId, labelId) 联合 PK，双 FK cascade |

> `percentComplete` 存储值仅为兼容；UI 用的聚合一律实时计算（见服务层）。

---

## 5. API 汇总（`app/api/`）

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/issues`、`/api/issues/[id]` | GET/POST/PATCH/DELETE | 看板数据（含 lean DTO） |
| `/api/projects`、`/api/projects/[id]` | GET/POST/PATCH/DELETE | 项目 + 实时聚合（totalIssues/completedIssues/percentComplete/healthUpdatedAgoDays） |
| `/api/projects/[id]/updates` | GET/POST | 发布更新 |
| `/api/projects/[id]/updates/[updateId]` | DELETE | 删单条更新 |
| `/api/cycles`、`/api/cycles/[id]` | GET/POST/PATCH/DELETE | 周期 + 实时聚合（scope/started/completed/successRate/burnup） |
| `/api/teams/[teamId]` | GET | 团队概览（team + 其 projects/cycles） |
| `/api/meta` | GET | labels/projects/cycles/users 参考数据 |

错误信封统一 `{code,message,details[],trace_id}`；zod schema 在 `lib/api-contract.ts`；客户端封装 `lib/api-*.ts`（共享 base `lib/api-client.ts`）。

**删除语义**：删项目 → 该 project 下 issues.projectId 置 NULL；删周期 → issues.cycleId 置 ''；不级联删 issue。project_updates/project_labels 级联。

---

## 6. 测试

```bash
pnpm test             # vitest — 80 tests（db/schema/seed、services、API 路由、store）
pnpm exec tsc --noEmit
```

要点：每个测试文件独立临时 DB（`data/test-*.db`，gitignore）；服务层测真实聚合/删除语义；store 测乐观+回滚；e2e 未建（Playwright 属 V2-C）。

---

## 7. 关键设计决策（此前 SDD 执行记录，摘录）

- **store 乐观写 + 失败回滚** 是全站写操作基线（含本项目 iterations 里一度被误删、后已恢复）。
- **`completedAt`**：issue 进入 `completed` 类状态时打一次时间戳（去 `/re-enter` 不覆盖）；燃尽图据此逐日算完成量。
- **日期序列化必须本地化**：`toLocalDateString`（`lib/date-utils.ts`），严禁 `toISOString().slice(0,10)`（UTC+X 会差一天）。服务端毫秒↔`yyyy-MM-dd` 用 `lib/dto.ts#toDateString`。
- **删除**：解关联不级联删 issue（见 §5）。
- **燃烧图仅 current/completed 周期产出**；366 天截断。
- **teams 只读参考表**；sidebar 团队导航仍读 mock（有意保留）。
- **其他功能页（inbox/agent/settings 等）仍是 mock**——页面能打开但非真实数据。

---

## 8. 遗留项 / 下一版路线图

**已知遗留（低优先，未做）**
- 项目头部 `project/header.tsx` 已接 store（清理批已修）；若遇新建项目页头异常先查此。
- `settings` 命名空间里仍是 mock 数据（真实化未排期）。
- 大数据量（>1k issues）看板/列表未虚拟化。
- 无自动化 E2E。
- Agent（`components/common/agent`）是关键词假回复——关键词已支持中英双语，但未接实时数据/LLM。

**V2 路线图**
| 子项目 | 状态 |
|---|---|
| V2-P1 项目/周期真实化 | ✅ 已合并（PR#2） |
| 遗留清理批 | ✅ 已合并（PR#3） |
| V2-P2 通知真实化（站内+系统） | ⬜ |
| V2-P3 Agent 真 LLM（DeepSeek） | ⬜ |
| V2-C 工程项（虚拟化/E2E/CI） | ⬜ |
| V2-B 远程/多端 | ⏸ 暂缓按需 |

---

## 9. 仓库与协作

- GitHub 远端 `github` → `arwei944/circle`；`origin` 指向上游 `ln-dev7/circle`（只读）。
- PR 记录：#1 数据层（V1）、#2 项目/周期（V2-P1）、#3 遗留清理。
- 本项目开发采用 **SDD（superpowers subagent-driven-development）**：规格在 `docs/superpowers/specs/`，实施计划在 `docs/superpowers/plans/`。后续大改动建议沿同一流程（spec → plan → SDD）。
- 提交经 `--no-verify`（本机 pre-commit 钩子不稳定，由显式 prettier/tsc/test + 评审把关）。新提交前务必 `pnpm test && pnpm exec tsc --noEmit && pnpm build`。

---

## 10. 快速排障

| 症状 | 检查 |
|---|---|
| 页面空白/数据不加载 | 服务器是否起？`ensureDb` 是否建了 `data/circle.db`？看 `data/circle.db` 是否存在 |
| 修改 mock 引用后编译不过 | 找到 `store/*-store` 的 hydrated 未满足处；provider 未挂 |
| API 404 | 确认路由文件存在、`/api/` 前缀对（middleware matcher 跳过 `/api`） |
| 日期差一天 | 违规 `toISOString().slice(0,10)`——改用 `toLocalDateString` |
| 测试污点 | 删 `data/test-*.db` 再跑 |

---

_交接人注意：本文件随版本更新；改架构/流程时同步维护 §2/§5/§7。_