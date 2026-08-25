import { LucideIcon, Box, Search, Workflow } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                          Agent page mock behaviors                         */
/* -------------------------------------------------------------------------- */

export interface AgentExample {
   id: string;
   icon: LucideIcon;
   title: string;
   description: string;
   prompt: string;
}

export const agentExamples: AgentExample[] = [
   {
      id: 'create-project',
      icon: Box,
      title: '创建新项目',
      description: '把一个想法变成一个边界清晰的项目',
      prompt: '创建一个项目，为文档站点交付命令面板',
   },
   {
      id: 'research-topic',
      icon: Search,
      title: '调研一个主题',
      description: '在整个问题待办区中调研一个主题',
      prompt: '我们对组合框无障碍问题有哪些了解？',
   },
   {
      id: 'automated-loop',
      icon: Workflow,
      title: '创建自动化流程',
      description: '了解自动化流程能做什么，并创建你的第一个',
      prompt: '帮我为 Core 团队设置每周待归类流程',
   },
];

export const agentSkills = ['待归类', '调研', '项目起草', '每周总结'];

interface CannedReply {
   keywords: string[];
   reply: string;
}

const CANNED_REPLIES: CannedReply[] = [
   {
      keywords: ['project', 'create', 'scope'],
      reply: `这是基于你的想法整理出来的清晰草案：

**项目 — 文档命令面板**
为文档站点打造一个 ⌘K 面板：支持在组件、属性与指南中进行模糊搜索，并带有最近访问项与键盘优先的导航。

**建议的里程碑**
1. 基于文档内容构建搜索索引（1 周）
2. 基于共享的 Dialog 原子组件实现面板 UI（1 周）
3. 最近访问、快捷键与数据分析（3 天）

**建议的问题** — 横跨 LNDev Core 的 6 个问题，负责人 **leonel.ngoya**，目标日期为 3 周后。

需要我用这些里程碑创建项目并分配第一批问题吗？`,
   },
   {
      keywords: ['research', 'know', 'accessib', 'combobox', 'backlog'],
      reply: `我浏览了整个待办区 — 以下是最值得关注的：

**组合框无障碍 — 7 个相关问题**
- **LNUI-633** 异步结果的 aria-live 播报（已完成，周期 18）
- **LNUI-856** 选项中的变音符号会导致筛选失效（待归类）
- **LNUI-783** 超过 1k 选项时的窗口化列表渲染（技术评审）
- **LNUI-746** 可创建选项行固定在列表底部（待办）

**信号**
屏幕阅读器支持在周期 18 中有所改进，但虚拟化列表仍会跳过窗口化选项的焦点 — 这是当前的主要开放风险，记录在 LNUI-783 中。

**建议** — 将这三个开放问题归入一个「组合框无障碍」标签，让它们进入同一个周期。需要我来操作吗？`,
   },
   {
      keywords: ['loop', 'weekly', 'triage', 'automat'],
      reply: `自动化流程会按计划运行并作用于你的工作区。下面是我建议设置的一个：

**每周待归类流程 — Core 团队**
- **每周一 9:00** — 收集处于待归类状态超过 3 天的问题
- **评估** — 根据过往相似问题给出优先级与负责人建议
- **汇报** — 在团队频道发布总结，并标记紧急事项

上周该流程预计可处理 **16 个问题**，并标记了 2 个紧急问题（LNUI-794、LNUI-795）。

需要我为 LNDev Core 团队启用它吗？`,
   },
   {
      keywords: ['cycle', 'progress', 'status'],
      reply: `**周期 21 — 第 12 天 / 共 14 天**

- **范围** 111 个问题（自开始以来 +44%）
- **已完成** 34（31%）· **进行中** 33（30%）
- 待办依然较多（38 个问题）— 按当前速度约有 19 个会滚动到周期 22。

**风险** — LNUI-787 和 LNUI-789 阻塞在上游修复上；LNUI-710 已阻塞 9 天。

需要按负责人拆分统计，或者为转移到周期 22 的事项拟一份草案吗？`,
   },
];

const DEFAULT_REPLY = `这是我在当前工作区可以为你做的事：

- **起草项目** — 根据一句话想法生成项目，附带里程碑与起步问题
- **调研待办区** — 汇总我们对任意组件或主题的已有认知
- **关注周期** — 进度、风险以及可能延期的事项
- **自动化** — 用自动化流程处理重复性工作（待归类、总结、提醒）

可以试着问问当前周期的情况，或从示例中选择一个开始。`;

/** Deterministic canned reply — no network, no randomness. */
export function getAgentReply(input: string): string {
   const normalized = input.toLowerCase();
   let best: { score: number; reply: string } = { score: 0, reply: DEFAULT_REPLY };
   for (const candidate of CANNED_REPLIES) {
      const score = candidate.keywords.filter((keyword) => normalized.includes(keyword)).length;
      if (score > best.score) best = { score, reply: candidate.reply };
   }
   return best.reply;
}

/** Short chat title derived from the first user message. */
export function chatTitleFrom(input: string): string {
   const clean = input.trim().replace(/\s+/g, ' ');
   return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || '新对话';
}
