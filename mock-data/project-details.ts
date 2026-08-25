import { ContentBlock } from './issue-details';
import { User, users } from './users';

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface ProjectMilestone {
   id: string;
   name: string;
   targetDate?: string;
   completed: boolean;
}

export type ProjectUpdateHealth = 'on-track' | 'at-risk' | 'off-track';

export const projectUpdateHealthLabel: Record<ProjectUpdateHealth, string> = {
   'on-track': '按计划进行',
   'at-risk': '存在风险',
   'off-track': '偏离计划',
};

export const projectUpdateHealthColor: Record<ProjectUpdateHealth, string> = {
   'on-track': '#4cb782',
   'at-risk': '#f2c94c',
   'off-track': '#eb5757',
};

/** A posted project update (the "Activity" tab timeline). */
export interface ProjectUpdate {
   id: string;
   author: User;
   date: string; // ISO date
   health: ProjectUpdateHealth;
   blocks: ContentBlock[];
}

/** Lightweight activity event ("x added themselves as a member…"). */
export interface ProjectActivityEvent {
   id: string;
   user: User;
   date: string;
   text: string;
}

export interface ProjectResource {
   label: string;
   url: string;
}

export interface ProjectDetail {
   projectId: string;
   /** One-line summary shown under the project name. */
   summary: string;
   description: ContentBlock[];
   resources: ProjectResource[];
   milestones: ProjectMilestone[];
   updates: ProjectUpdate[];
   activity: ProjectActivityEvent[];
}

/* -------------------------------------------------------------------------- */
/*                            Handcrafted details                             */
/* -------------------------------------------------------------------------- */

const detailsById: Record<string, Omit<ProjectDetail, 'projectId'>> = {
   // LNDev UI - Core Components
   '1': {
      summary:
         '在共享行为层之上重建核心原子组件（Button、Input、Dialog、Menu）。目标：统一无障碍契约、减小包体积、零视觉回归。',
      description: [
         { type: 'heading', text: '1. 问题对齐' },
         { type: 'heading', text: '🔍 问题与洞察', level: 2 },
         {
            type: 'paragraph',
            text: '目前每个核心原子组件都自带各自的焦点、关闭与定位逻辑。这份重复带来约 9kb（gzip）的体积成本，而细微的行为差异（Escape 处理、焦点返回）会让混用组件的用户感到困惑。',
         },
         {
            type: 'paragraph',
            text: '共享行为层可以让我们一次性修复无障碍问题，并保证所有浮层组件都以相同方式关闭、限制并恢复焦点。',
         },
         { type: 'heading', text: '👥 目标用户', level: 2 },
         {
            type: 'paragraph',
            text: '面向构建数据密集型内部工具的产品团队，以**桌面优先**为主。迁移需要对已使用 v2 的约 40 个应用做好 codemod 支持。',
         },
         { type: 'divider' },
         { type: 'heading', text: '2. 解决方案' },
         {
            type: 'bullet-list',
            items: [
               '将 `useDismissable`、`useFocusScope` 和 `useAnchorPosition` 抽取到 `@lndev-ui/behaviors`。',
               '在共享 hooks 之上重写 Dialog、Menu、Popover 和 Tooltip。',
               '在切换默认导出之前，发布 codemod 与视觉回归测试套件。',
            ],
         },
         {
            type: 'quote',
            text: '成功标准 = 40 个参考应用上零视觉差异，且一次无障碍审计即可覆盖所有浮层。',
         },
      ],
      resources: [{ label: 'PRD — 核心原子组件重写', url: '#' }],
      milestones: [
         { id: 'm1', name: '行为层已抽取', targetDate: '2026-08-14', completed: true },
         { id: 'm2', name: 'Dialog + Menu 已迁移', targetDate: '2026-09-04', completed: false },
         { id: 'm3', name: 'Codemod 与发布', targetDate: '2026-09-25', completed: false },
      ],
      updates: [
         {
            id: 'u1',
            author: users[2],
            date: '2026-07-28',
            health: 'on-track',
            blocks: [
               {
                  type: 'paragraph',
                  text: '行为层已合并。Dialog 在 flag 开关下运行于 `useFocusScope` 之上 — 演练场套件（212 个场景）无回归。',
               },
               {
                  type: 'checklist',
                  items: [
                     { text: 'useDismissable 已抽取并由测试覆盖', checked: true },
                     { text: 'Dialog 已在 `next` flag 下完成迁移', checked: true },
                     { text: 'Menu 迁移', checked: false },
                  ],
               },
            ],
         },
         {
            id: 'u2',
            author: users[0],
            date: '2026-07-14',
            health: 'on-track',
            blocks: [
               {
                  type: 'paragraph',
                  text: '启动会已完成。范围锁定在四个浮层原子组件；Tabs 和 Accordion 移入 Q4 计划。',
               },
            ],
         },
      ],
      activity: [
         {
            id: 'a1',
            user: users[4],
            date: '2026-07-24',
            text: '评论「已在预演环境演练场测试 — 跨嵌套 portal 的焦点返回正常。」',
         },
         { id: 'a2', user: users[7], date: '2026-07-17', text: '将自己添加为成员' },
         { id: 'a3', user: users[0], date: '2026-07-10', text: '将目标日期改为 9 月 25 日' },
      ],
   },

   // LNDev UI - Theming
   '2': {
      summary: '令牌流水线 v2：由单一事实来源生成 OKLCH 调色板、语义别名与按品牌的主题包。',
      description: [
         { type: 'heading', text: '1. 问题对齐' },
         { type: 'heading', text: '🔍 问题与洞察', level: 2 },
         {
            type: 'paragraph',
            text: '目前品牌会直接覆盖原始十六进制色值，因此每次调色板微调都会扩散成一批手工修改的文件。由于没有工具校验派生出的配对，对比度问题常常漏网。',
         },
         { type: 'heading', text: '🎯 目标', level: 2 },
         {
            type: 'numbered-list',
            items: [
               '以单一 `tokens.json` 为事实来源，端到端使用 OKLCH。',
               '在核心与组件之间建立语义别名层（`surface`、`accent`、`danger`…）。',
               'CI 校验所有生成的配对均通过 APCA Lc 60。',
            ],
         },
         { type: 'divider' },
         { type: 'heading', text: '2. 上线计划' },
         {
            type: 'bullet-list',
            items: [
               '第 1–2 周：生成器 + 校验器。',
               '第 3 周：迁移默认主题，为自定义主题发布 codemod。',
               '第 4 周：品牌试点（两家设计合作方），随后全面开放。',
            ],
         },
      ],
      resources: [
         { label: '规范 — 令牌流水线 v2', url: '#' },
         { label: 'APCA 校验表', url: '#' },
      ],
      milestones: [
         { id: 'm1', name: '生成器 + 校验器', targetDate: '2026-08-21', completed: true },
         { id: 'm2', name: '默认主题已迁移', targetDate: '2026-09-11', completed: false },
      ],
      updates: [
         {
            id: 'u1',
            author: users[0],
            date: '2026-07-30',
            health: 'at-risk',
            blocks: [
               {
                  type: 'paragraph',
                  text: '校验器已完成，但旧版 Safari 的 OKLCH 降级方案比预期复杂 — 我们可能需要为每个主题生成构建时的 sRGB 快照。已安排两天的调研。',
               },
            ],
         },
      ],
      activity: [
         { id: 'a1', user: users[3], date: '2026-07-26', text: '附上了「APCA 校验表」' },
         { id: 'a2', user: users[0], date: '2026-07-19', text: '将健康度设为存在风险' },
      ],
   },

   // LNDev UI - Data Tables
   '10': {
      summary:
         'Data grid 正式发布：支持 100k 行的虚拟化、列固定、行分组，以及与文档示例共享的无头排序/筛选核心。',
      description: [
         { type: 'heading', text: '1. 问题对齐' },
         {
            type: 'paragraph',
            text: '当前 Table 组件大约只能承载 2k 行，每个团队都在其之上重新实现固定与分组。网格组件是最近三次季度调研中需求度最高的组件。',
         },
         { type: 'heading', text: '👥 目标用户', level: 2 },
         {
            type: 'paragraph',
            text: '运维与数据分析团队。遥测中观测到的 P95 数据集：38k 行、24 列。',
         },
         { type: 'divider' },
         { type: 'heading', text: '2. 非目标' },
         {
            type: 'bullet-list',
            items: [
               '类电子表格编辑（另行跟踪）。',
               '服务端驱动行模型 — 正式版核心保持客户端优先。',
            ],
         },
      ],
      resources: [{ label: 'PRD — Data grid 正式发布', url: '#' }],
      milestones: [
         { id: 'm1', name: '虚拟化表体', targetDate: '2026-08-28', completed: true },
         { id: 'm2', name: '列固定', targetDate: '2026-09-18', completed: false },
         { id: 'm3', name: '行分组 + 正式发布', targetDate: '2026-10-09', completed: false },
      ],
      updates: [
         {
            id: 'u1',
            author: users[4],
            date: '2026-07-27',
            health: 'on-track',
            blocks: [
               {
                  type: 'paragraph',
                  text: '100k 行基准测试在 M1 Air 上以 overscan 8 保持 60fps。列固定阴影分隔线正在评审中。',
               },
               {
                  type: 'code',
                  language: 'text',
                  code: 'scroll p50: 4.1ms · p95: 11.8ms · dropped frames: 0.4%',
               },
            ],
         },
      ],
      activity: [
         {
            id: 'a1',
            user: users[10],
            date: '2026-07-22',
            text: '评论「分组 API 配合聚合表脚看起来很棒。」',
         },
         {
            id: 'a2',
            user: users[4],
            date: '2026-07-15',
            text: '创建了里程碑「行分组 + 正式发布」',
         },
      ],
   },
};

/* -------------------------------------------------------------------------- */
/*                        Deterministic fallback details                      */
/* -------------------------------------------------------------------------- */

const hashString = (value: string): number => {
   let hash = 0;
   for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
   }
   return hash;
};

const SUMMARIES = [
   '将该界面提升到设计系统质量标准：无障碍处理、密度选项与暗色模式对比度评审。',
   '处理季度调研中的高优先级需求，并在下一轮推广前偿还问题积压。',
   '稳定 API、编写示例文档，并为仍在使用 v2 的团队发布迁移 codemod。',
];

const FALLBACK_BLOCKS: ContentBlock[][] = [
   [
      { type: 'heading', text: '为什么现在' },
      {
         type: 'paragraph',
         text: '过去两个季度该界面的使用量翻了一倍，而问题积压却持续增长。本项目汇总修复项、补齐无障碍缺口，并整理受支持的模式文档。',
      },
      { type: 'heading', text: '范围' },
      {
         type: 'bullet-list',
         items: [
            '修复报告最多的缺陷（见「问题」标签页）。',
            '审计键盘与屏幕阅读器流程。',
            '更新文档示例并补充两个真实场景的示例。',
         ],
      },
   ],
   [
      { type: 'heading', text: '问题' },
      {
         type: 'paragraph',
         text: '由于已发布版本缺少几个关键选项，团队一直本地重建。分叉数量就是信号：五个内部副本，都各有偏差。',
      },
      { type: 'heading', text: '方案' },
      {
         type: 'numbered-list',
         items: [
            '访谈三个重度使用方。',
            '在次要版本中补上缺失的选项。',
            '删除分叉 — 在遥测中跟踪采用率。',
         ],
      },
   ],
];

const fallbackDetail = (projectId: string): Omit<ProjectDetail, 'projectId'> => {
   const hash = hashString(projectId);
   return {
      summary: SUMMARIES[hash % SUMMARIES.length],
      description: FALLBACK_BLOCKS[hash % FALLBACK_BLOCKS.length],
      resources: [],
      milestones: [],
      updates: [],
      activity: [
         {
            id: 'a1',
            user: users[hash % users.length],
            date: '2026-07-21',
            text: '将自己添加为成员',
         },
      ],
   };
};

export function getProjectDetail(projectId: string): ProjectDetail {
   const detail = detailsById[projectId] ?? fallbackDetail(projectId);
   return { projectId, ...detail };
}
