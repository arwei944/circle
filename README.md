# Circle

<br />
<a href="https://vercel.com/oss">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge.svg" />
</a>

<br />
<br />

Project management interface inspired by Linear. Built with Next.js and shadcn/ui, this application allows tracking of issues, projects and teams with a modern, responsive UI.

> The BaseUI code is available on [Square UI Pro](https://pro.lndevui.com/templates/circle-baseui).

## 🛠️ Technologies

- **Framework**: [Next.js](https://nextjs.org/)
- **Langage**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### 📦 Installation

```shell
git clone https://github.com/ln-dev7/circle.git
cd circle
```

### Install dependencies

```shell
pnpm install
```

### Start the development server

```shell
pnpm dev
```

## 数据层（个人版）

- 存储：SQLite `data/circle.db`（Drizzle ORM + better-sqlite3）
- 首次启动自动迁移并 seed（来自 mock-data）；`SKIP_SEED=1` 可跳过
- API：`/api/issues`、`/api/issues/[id]`、`/api/meta`（zod 校验 + 统一错误信封）
- 前端：`issues-data-provider` 灌入 `issues-store`，所有问题写操作乐观更新、失败自动回滚
- 命令：`pnpm db:generate` / `db:migrate` / `db:seed` / `backup` / `test`
- 备份：`pnpm backup`（保留最近 7 份）
- 注：列内拖拽排序为未来能力；当前跨列拖拽变更状态已持久化。

## Star History

<a href="https://www.star-history.com/#ln-dev7/circle&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ln-dev7/circle&type=Date" />
 </picture>
</a>
