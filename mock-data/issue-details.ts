import { Issue } from './issues';
import { User, users } from './users';

/* -------------------------------------------------------------------------- */
/*                         Rich content block model                           */
/* -------------------------------------------------------------------------- */

/**
 * Structured description content. Text supports lightweight inline
 * formatting: `code` and **bold** (parsed by the block renderer).
 */
export type ContentBlock =
   | { type: 'heading'; text: string; level?: 1 | 2 }
   | { type: 'paragraph'; text: string }
   | { type: 'bullet-list'; items: string[] }
   | { type: 'numbered-list'; items: string[] }
   | { type: 'checklist'; items: { text: string; checked: boolean }[] }
   | { type: 'code'; language: string; code: string }
   | { type: 'image'; alt: string; caption?: string; aspect?: 'wide' | 'video' | 'square' }
   | { type: 'video'; title: string; duration?: string }
   | { type: 'quote'; text: string; author?: string }
   | { type: 'divider' }
   | { type: 'issue-ref'; identifier: string; note?: string };

export interface CommentReaction {
   emoji: string;
   count: number;
}

export type ActivityItem =
   | {
        kind: 'event';
        id: string;
        actor: User;
        /** e.g. 'created' | 'status' | 'label' | 'priority' | 'cycle' | 'blocked' | 'unblocked' | 'related' | 'pr' */
        event: string;
        text: string;
        timeAgo: string;
     }
   | {
        kind: 'comment';
        id: string;
        actor: User;
        timeAgo: string;
        body: ContentBlock[];
        reactions?: CommentReaction[];
     };

export interface PrLink {
   id: string;
   title: string;
   status: 'open' | 'merged' | 'draft';
}

export interface IssueDetail {
   identifier: string;
   description: ContentBlock[];
   activity: ActivityItem[];
   subIssueIds?: string[];
   relatedIds?: string[];
   blockedByIds?: string[];
   prLinks?: PrLink[];
   milestone?: string;
}

/* -------------------------------------------------------------------------- */
/*                        Handcrafted issue details                           */
/* -------------------------------------------------------------------------- */

const details: IssueDetail[] = [
   {
      identifier: 'LNUI-703',
      description: [
         { type: 'heading', text: '背景' },
         {
            type: 'paragraph',
            text: '当前 `Dialog` 的焦点陷阱依赖手写的 `focusin` 监听器。一旦嵌套 portal（Select、Combobox、DatePicker）把内容渲染到对话框子树之外，它就会失效：焦点被强行拉回对话框，嵌套组件随之关闭。',
         },
         { type: 'heading', text: '建议方案' },
         {
            type: 'paragraph',
            text: '通过 context 维护一个 **portal 根节点白名单**。位于已注册根节点内的任何元素，在焦点限制上都视为对话框的一部分。',
         },
         {
            type: 'code',
            language: 'tsx',
            code: `const PortalRootContext = createContext<Set<HTMLElement>>(new Set());

export function useDialogPortalRoot(node: HTMLElement | null) {
   const roots = useContext(PortalRootContext);
   useEffect(() => {
      if (!node) return;
      roots.add(node);
      return () => void roots.delete(node);
   }, [node, roots]);
}`,
         },
         { type: 'heading', text: '验收标准' },
         {
            type: 'checklist',
            items: [
               { text: '在 Dialog 内打开的 Select 保持焦点在其列表框中', checked: true },
               { text: '嵌套 Dialog（2 层）在最顶层限制焦点', checked: true },
               { text: 'Escape 只关闭最顶层', checked: false },
               { text: 'VoiceOver / NVDA 正确播报对话框', checked: false },
            ],
         },
         { type: 'divider' },
         {
            type: 'issue-ref',
            identifier: 'LNUI-643',
            note: '之前修复滚动条布局偏移的改动涉及同一套浮层代码',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'a1',
            actor: users[1],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '12天前',
         },
         {
            kind: 'event',
            id: 'a2',
            actor: users[1],
            event: 'label',
            text: '添加了缺陷标签',
            timeAgo: '12天前',
         },
         {
            kind: 'event',
            id: 'a3',
            actor: users[2],
            event: 'status',
            text: '将状态从「待办」改为「进行中」',
            timeAgo: '9天前',
         },
         {
            kind: 'comment',
            id: 'a4',
            actor: users[1],
            timeAgo: '8天前',
            body: [
               {
                  type: 'paragraph',
                  text: '提醒一下：Radix 通过 `DismissableLayer` 树解决了这个问题。在重新实现之前值得读一下他们的实现 — 分支修剪逻辑很微妙。',
               },
            ],
            reactions: [{ emoji: '👍', count: 3 }],
         },
         {
            kind: 'comment',
            id: 'a5',
            actor: users[2],
            timeAgo: '6天前',
            body: [
               {
                  type: 'paragraph',
                  text: '同意。我保留了 context 注册表方案，但镜像了他们的层序。草稿 PR 已就绪，剩余两个勾选项需要屏幕阅读器过一遍。',
               },
            ],
         },
      ],
      relatedIds: ['LNUI-643', 'LNUI-744'],
      prLinks: [{ id: '#212', title: 'fix(dialog): portal 感知的焦点限制', status: 'open' }],
   },
   {
      identifier: 'LNUI-704',
      description: [
         {
            type: 'paragraph',
            text: '渲染 10k+ 行会让 `DataTable` 不可用：初始渲染耗时 **4.2 秒**，在中端笔记本上滚动掉到约 11fps。',
         },
         {
            type: 'image',
            alt: 'React Profiler 10k 行渲染的火焰图',
            caption: 'Profiler 截图 — 92% 的时间花在挂载行单元格上',
            aspect: 'wide',
         },
         { type: 'heading', text: '计划' },
         {
            type: 'numbered-list',
            items: [
               '使用固定 12 行的 overscan 做窗口化（无外部依赖，约 120 行代码）',
               '以行 id 为 key 的行高测量缓存，支持可变高度',
               '粘性表头保持在滚动容器之外',
               '键盘导航跳转时必须滚动虚拟窗口',
            ],
         },
         {
            type: 'video',
            title: '滚动录屏 — 120fps 原型',
            duration: '0:42',
         },
         {
            type: 'quote',
            text: '预算：10k 行下表首帧在 300ms 以内，滚动至少 60fps。',
            author: '性能预算，Q3 笔记',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'b1',
            actor: users[4],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '11天前',
         },
         {
            kind: 'event',
            id: 'b2',
            actor: users[4],
            event: 'cycle',
            text: '将此问题加入周期 21',
            timeAgo: '11天前',
         },
         {
            kind: 'event',
            id: 'b3',
            actor: users[0],
            event: 'priority',
            text: '将优先级设为高',
            timeAgo: '10天前',
         },
         {
            kind: 'comment',
            id: 'b4',
            actor: users[0],
            timeAgo: '4天前',
            body: [
               {
                  type: 'paragraph',
                  text: '参考数据集上的原型数据：首帧 **278ms**，稳定 60fps 滚动，堆内存 74MB（原来 410MB）。可以发布。',
               },
            ],
            reactions: [
               { emoji: '🔥', count: 4 },
               { emoji: '🚀', count: 2 },
            ],
         },
      ],
      subIssueIds: ['LNUI-726'],
      relatedIds: ['LNUI-685'],
      prLinks: [{ id: '#198', title: 'perf(table): 窗口化行渲染', status: 'merged' }],
   },
   {
      identifier: 'LNUI-701',
      description: [
         { type: 'heading', text: '复现步骤' },
         {
            type: 'numbered-list',
            items: [
               '打开包含禁用选项列表的 Combobox 演示',
               '聚焦输入框并反复按 `ArrowDown`',
               '到达被两个可用选项夹住的禁用选项',
            ],
         },
         { type: 'heading', text: '预期行为' },
         {
            type: 'paragraph',
            text: '两个方向都应该跳过禁用选项，落到下一个可用选项上。',
         },
         { type: 'heading', text: '实际行为' },
         {
            type: 'paragraph',
            text: '**向下**跳过正确，**向上**会停在禁用选项上，且 `aria-activedescendant` 指向了不可交互的元素。',
         },
         { type: 'video', title: '屏幕录制 — 键盘导航 bug', duration: '0:18' },
         { type: 'divider' },
         {
            type: 'paragraph',
            text: '很可能是 `findNextEnabledIndex` 向后迭代时的差一（off-by-one）错误。',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'c1',
            actor: users[0],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '10天前',
         },
         {
            kind: 'event',
            id: 'c2',
            actor: users[0],
            event: 'status',
            text: '将状态从「待归类」改为「产品反馈」',
            timeAgo: '9天前',
         },
         {
            kind: 'comment',
            id: 'c3',
            actor: users[7],
            timeAgo: '7天前',
            body: [
               {
                  type: 'paragraph',
                  text: '在 Firefox 和 Safari 上同样复现 — 并非浏览器特有。反向迭代器从 `index` 而不是 `index - 1` 开始。',
               },
            ],
            reactions: [{ emoji: '👀', count: 2 }],
         },
      ],
      relatedIds: ['LNUI-819'],
   },
   {
      identifier: 'LNUI-702',
      description: [
         {
            type: 'quote',
            text: '在我旧安卓手机上切换月份几乎要一秒，动画卡顿非常严重。',
            author: '用户反馈，支持工单 #482',
         },
         {
            type: 'paragraph',
            text: '在 4x CPU 降速下复现。每次切换月份都要重渲染 **42 个日期单元格**加上表头，每个单元格还会重新计算其 formatter。',
         },
         { type: 'heading', text: '假设' },
         {
            type: 'bullet-list',
            items: [
               '`Intl.DateTimeFormat` 实例每次渲染每个单元格都会创建 — 应提升并复用',
               '月份过渡动画使用 `box-shadow`（绘制开销大），改为 `transform`/`opacity`',
               '日期单元格可以记忆化：渲染之间只有选中状态和今天会变化',
            ],
         },
         {
            type: 'image',
            alt: 'Chrome 一次月份切换的性能轨迹',
            caption: '轨迹 — 4x 降速下脚本 610ms、渲染 220ms',
            aspect: 'wide',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'd1',
            actor: users[6],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '10天前',
         },
         {
            kind: 'comment',
            id: 'd2',
            actor: users[6],
            timeAgo: '5天前',
            body: [
               {
                  type: 'paragraph',
                  text: '仅提升 formatter 就把脚本耗时从 610ms 降到 180ms。其余部分是阴影动画。',
               },
            ],
         },
         {
            kind: 'comment',
            id: 'd3',
            actor: users[13],
            timeAgo: '4天前',
            body: [
               {
                  type: 'paragraph',
                  text: '设计上同意在低端设备上用简单的透明度交叉淡入淡出 — 我们也可以把它与 `prefers-reduced-motion` 关联。',
               },
            ],
            reactions: [{ emoji: '✅', count: 1 }],
         },
      ],
   },
   {
      identifier: 'LNUI-706',
      description: [
         { type: 'heading', text: '目标' },
         {
            type: 'bullet-list',
            items: [
               '将所有颜色令牌从 HSL 迁移到 **OKLCH** 以获得感知均匀性',
               '为不支持 `oklch()` 的浏览器保留 HSL 降级',
               '现有主题上视觉回归不超过 deltaE 1.5',
            ],
         },
         { type: 'heading', text: '令牌映射' },
         {
            type: 'code',
            language: 'css',
            code: `:root {
   /* 之前 */
   --primary: hsl(243 75% 59%);

   /* 之后 — 先回退，再以 OKLCH 覆盖 */
   --primary: hsl(243 75% 59%);
}

@supports (color: oklch(0% 0 0)) {
   :root {
      --primary: oklch(58.5% 0.233 277.1);
   }
}`,
         },
         { type: 'heading', text: '迁移步骤' },
         {
            type: 'checklist',
            items: [
               {
                  text: '将 HSL 调色板转换为 OKLCH 的脚本（往返校验通过）',
                  checked: true,
               },
               { text: '为亮色 + 暗色重新生成 `globals.css` 令牌', checked: true },
               { text: '在 12 个模板页面上做视觉对比', checked: false },
               { text: '更新主题文档与主题生成器', checked: false },
            ],
         },
         { type: 'divider' },
         { type: 'issue-ref', identifier: 'LNUI-729', note: '主题切换器必须重新读取令牌' },
      ],
      activity: [
         {
            kind: 'event',
            id: 'e1',
            actor: users[12],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '8天前',
         },
         {
            kind: 'event',
            id: 'e2',
            actor: users[12],
            event: 'status',
            text: '将状态从「待办」改为「进行中」',
            timeAgo: '7天前',
         },
         {
            kind: 'comment',
            id: 'e3',
            actor: users[19],
            timeAgo: '2天前',
            body: [
               {
                  type: 'paragraph',
                  text: '转换后的暗色调色板在渐变上明显更平滑。两个令牌（`--warning`、`--chart-3`）漂移超过了 deltaE 1.5，正在手动调整色度。',
               },
            ],
            reactions: [{ emoji: '🎨', count: 2 }],
         },
      ],
      subIssueIds: ['LNUI-729', 'LNUI-734'],
      milestone: '设计令牌 v2',
   },
   {
      identifier: 'LNUI-710',
      description: [
         {
            type: 'paragraph',
            text: '当传给命令面板的异步源**抛错**时（网络错误、JSON 损坏），加载 spinner 永远不结束，整个面板都会失去响应 — 即使本地命令也是。',
         },
         {
            type: 'code',
            language: 'text',
            code: `Unhandled Promise Rejection: TypeError: results is not iterable
   at CommandPalette.mergeSources (command-palette.tsx:141)
   at async Promise.all (index 2)`,
         },
         {
            type: 'paragraph',
            text: '修复方向：用 `Promise.allSettled` 隔离每个异步源，按源渲染错误行，并在远程源挂起时保持本地命令可交互。',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'f1',
            actor: users[3],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '7天前',
         },
         {
            kind: 'event',
            id: 'f2',
            actor: users[3],
            event: 'blocked',
            text: '将此问题标记为被 LNUI-707 阻塞',
            timeAgo: '6天前',
         },
         {
            kind: 'comment',
            id: 'f3',
            actor: users[3],
            timeAgo: '3天前',
            body: [
               {
                  type: 'paragraph',
                  text: '被定位重构阻塞，因为错误行会改变调色板高度，而旧定位代码会跳动。',
               },
            ],
         },
      ],
      blockedByIds: ['LNUI-707'],
      relatedIds: ['LNUI-728'],
   },
   {
      identifier: 'LNUI-712',
      description: [
         {
            type: 'paragraph',
            text: 'Card 和 Table 需要一流的骨架屏变体，这样加载状态就不必在每个应用里手写了。',
         },
         {
            type: 'checklist',
            items: [
               { text: '`CardSkeleton` — 表头、媒体插槽、两行文本', checked: false },
               { text: '`TableSkeleton` — 可配置的行 × 列', checked: false },
               { text: '微光效果遵循 `prefers-reduced-motion`', checked: false },
            ],
         },
         {
            type: 'image',
            alt: '骨架屏变体设计稿',
            caption: '设计稿 — 亮色与暗色的卡片与表格骨架屏',
            aspect: 'video',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'g1',
            actor: users[5],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '12天前',
         },
         {
            kind: 'event',
            id: 'g2',
            actor: users[5],
            event: 'cycle',
            text: '将此问题加入周期 21',
            timeAgo: '12天前',
         },
      ],
   },
   {
      identifier: 'LNUI-718',
      description: [
         {
            type: 'paragraph',
            text: 'Badge 文档页应嵌入**交互式演练场**：变体、尺寸与颜色选择器，并实时输出可复制的代码。',
         },
         {
            type: 'image',
            alt: '演练场布局线框图',
            caption: '线框图 — 左侧为控件，右侧为实时预览与代码',
            aspect: 'wide',
         },
         {
            type: 'image',
            alt: '演练场的移动端布局',
            caption: '移动端控件收进底部弹层',
            aspect: 'square',
         },
         {
            type: 'bullet-list',
            items: [
               '控件从组件属性表生成（单一事实来源）',
               '代码输出保持同步且可直接复制',
               '演练场状态编码进 URL 以便分享',
            ],
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'h1',
            actor: users[15],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '7天前',
         },
         {
            kind: 'comment',
            id: 'h2',
            actor: users[9],
            timeAgo: '5天前',
            body: [
               {
                  type: 'paragraph',
                  text: 'URL 编码的状态与文档搜索索引工作配合得很好 — 共享的演练场链接会变成文档内的深链。',
               },
            ],
         },
      ],
      relatedIds: ['LNUI-731', 'LNUI-815'],
   },
   {
      identifier: 'LNUI-722',
      description: [
         {
            type: 'paragraph',
            text: '我们的分类图调色板在红色弱视下失效：系列 2 和系列 4 无法区分。我们需要一个既色盲友好又与品牌匹配的色阶。',
         },
         {
            type: 'image',
            alt: 'CVD 模拟下当前与提案调色板对比',
            caption: '模拟 — 上图：当前调色板，下图：红色弱视下的提案',
            aspect: 'wide',
         },
         { type: 'heading', text: '约束条件' },
         {
            type: 'bullet-list',
            items: [
               '至少 8 个可区分的分类色阶',
               '每个色阶在亮/暗两种 `--background` 值下都清晰可读',
               '顺序与发散色带由同一组锚点派生',
            ],
         },
         {
            type: 'quote',
            text: '颜色永远不应是编码数据系列的唯一通道。',
            author: '无障碍指南，图表章节',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'i1',
            actor: users[19],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '3天前',
         },
         {
            kind: 'event',
            id: 'i2',
            actor: users[19],
            event: 'label',
            text: '添加了「无障碍」「设计」标签',
            timeAgo: '3天前',
         },
      ],
      relatedIds: ['LNUI-727'],
   },
   {
      identifier: 'LNUI-726',
      description: [
         {
            type: 'paragraph',
            text: '表格筛选中的每次按键都会重渲染**所有**可见行。用带自定义比较器的 `memo` 包裹行渲染器后，重渲染减少了约 60%。',
         },
         {
            type: 'code',
            language: 'tsx',
            code: `const TableRow = memo(TableRowImpl, (prev, next) =>
   prev.row.id === next.row.id &&
   prev.row.version === next.row.version &&
   prev.isSelected === next.isSelected
);`,
         },
         {
            type: 'paragraph',
            text: '在 1k 行演示上测得：按键延迟从 96ms 降到 **34ms**（p95）。',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'j1',
            actor: users[4],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '11天前',
         },
         {
            kind: 'event',
            id: 'j2',
            actor: users[4],
            event: 'pr',
            text: '关联了拉取请求 #196',
            timeAgo: '10天前',
         },
         {
            kind: 'event',
            id: 'j3',
            actor: users[4],
            event: 'status',
            text: '将状态从「进行中」改为「已完成」',
            timeAgo: '9天前',
         },
         {
            kind: 'comment',
            id: 'j4',
            actor: users[8],
            timeAgo: '9天前',
            body: [{ type: 'paragraph', text: '干得漂亮 — 筛选现在立刻就有响应了。🎉' }],
            reactions: [{ emoji: '🎉', count: 5 }],
         },
      ],
      prLinks: [{ id: '#196', title: 'perf(table): 记忆化行渲染', status: 'merged' }],
   },
   {
      identifier: 'LNUI-735',
      description: [
         {
            type: 'paragraph',
            text: '**Empty State** 组件自带三个插画插槽（无数据、错误、首次使用）以及可组合的操作。',
         },
         {
            type: 'image',
            alt: '空状态组件预览',
            caption: '预览 — 无数据变体，含主要 + 次要操作',
            aspect: 'video',
         },
         { type: 'heading', text: '发布说明' },
         {
            type: 'bullet-list',
            items: [
               '`<EmptyState />` 带 `illustration`、`title`、`description`、`actions` 插槽',
               '随组件提供 3 幅中性 SVG 插画，未使用时被摇树优化掉',
               '文档页包含使用指南与正面/反面示例',
            ],
         },
         {
            type: 'quote',
            text: '空状态是大多数用户看到的第一个界面 — 应把它当作落地页，而不是事后补丁。',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'k1',
            actor: users[3],
            event: 'created',
            text: '创建了此问题',
            timeAgo: '9天前',
         },
         {
            kind: 'event',
            id: 'k2',
            actor: users[3],
            event: 'pr',
            text: '关联了拉取请求 #205',
            timeAgo: '5天前',
         },
         {
            kind: 'event',
            id: 'k3',
            actor: users[3],
            event: 'status',
            text: '将状态从「技术评审」改为「已发布」',
            timeAgo: '2天前',
         },
      ],
      prLinks: [{ id: '#205', title: 'feat(empty-state): 新组件 + 文档', status: 'merged' }],
   },
   {
      identifier: 'LNUI-819',
      description: [
         { type: 'heading', text: '复现' },
         {
            type: 'numbered-list',
            items: ['传入一个 `options` 数组为空的选项分组', '打开 Combobox', '第一次按键即崩溃'],
         },
         {
            type: 'code',
            language: 'text',
            code: `TypeError: Cannot read properties of undefined (reading 'value')
   at getFirstOption (combobox.tsx:88)
   at handleKeyDown (combobox.tsx:203)`,
         },
         {
            type: 'paragraph',
            text: '通过文档反馈组件报告。需要待归类处理：要么在渲染时跳过空分组，要么为 `getFirstOption` 加保护。',
         },
      ],
      activity: [
         {
            kind: 'event',
            id: 'l1',
            actor: users[16],
            event: 'created',
            text: '根据文档反馈创建了此问题',
            timeAgo: '2天前',
         },
      ],
      relatedIds: ['LNUI-701'],
   },
];

/* -------------------------------------------------------------------------- */
/*                     Deterministic fallback generation                      */
/* -------------------------------------------------------------------------- */

const hashString = (value: string): number => {
   let hash = 0;
   for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) % 100003;
   }
   return hash;
};

/**
 * Builds a plausible detail for issues without a handcrafted one.
 * Deterministic (seeded by the identifier) so SSR and client match.
 */
const buildFallbackDetail = (issue: Issue): IssueDetail => {
   const seed = hashString(issue.identifier);
   const author = issue.assignee ?? users[seed % users.length];
   const reporter = users[(seed + 7) % users.length];

   const intro: ContentBlock = {
      type: 'paragraph',
      text: `${issue.title}。此工作归属于 ${issue.project ? `**${issue.project.name}**` : '组件库'} — 具体实现说明见下文。`,
   };

   const variants: ContentBlock[][] = [
      [
         intro,
         {
            type: 'checklist',
            items: [
               { text: '在团队频道中对齐 API 形态', checked: seed % 2 === 0 },
               { text: '实现并补充单元测试', checked: false },
               { text: '更新文档页并附带示例', checked: false },
            ],
         },
      ],
      [
         intro,
         {
            type: 'bullet-list',
            items: ['保持公共 API 向后兼容', '不新增运行时依赖', '遵循现有 Tailwind 令牌约定'],
         },
         {
            type: 'paragraph',
            text: '关闭前应将边界情况和浏览器怪癖固化为测试用例。',
         },
      ],
      [
         { type: 'heading', text: '背景' },
         intro,
         { type: 'heading', text: '计划' },
         {
            type: 'numbered-list',
            items: ['在文档演示中标定并验证方案', '在现有组件 API 背后实现', '合并前与设计端评审'],
         },
      ],
      [
         intro,
         {
            type: 'quote',
            text: '小而可组合的原子组件优于可配置的巨石组件。',
            author: '组件库设计原则',
         },
         {
            type: 'paragraph',
            text: '在修改包根目录导出的任何内容之前，先联系维护者。',
         },
      ],
   ];

   const activity: ActivityItem[] = [
      {
         kind: 'event',
         id: `${issue.id}-created`,
         actor: reporter,
         event: 'created',
         text: '创建了此问题',
         timeAgo: `${(seed % 12) + 2}天前`,
      },
   ];

   if (issue.cycleId !== '') {
      activity.push({
         kind: 'event',
         id: `${issue.id}-cycle`,
         actor: reporter,
         event: 'cycle',
         text: `将此问题加入周期 ${issue.cycleId}`,
         timeAgo: `${(seed % 10) + 1}天前`,
      });
   }

   if (issue.status.category === 'started' || issue.status.category === 'completed') {
      activity.push({
         kind: 'event',
         id: `${issue.id}-status`,
         actor: author,
         event: 'status',
         text: `将状态从「待办」改为「${issue.status.name}」`,
         timeAgo: `${(seed % 6) + 1}天前`,
      });
   }

   if (seed % 3 === 0) {
      activity.push({
         kind: 'comment',
         id: `${issue.id}-comment`,
         actor: users[(seed + 3) % users.length],
         timeAgo: `${(seed % 4) + 1}天前`,
         body: [
            {
               type: 'paragraph',
               text: '本周会看一下 — 开 PR 之前会先把结论发在这里。',
            },
         ],
      });
   }

   return {
      identifier: issue.identifier,
      description: variants[seed % variants.length],
      activity,
   };
};

/* -------------------------------------------------------------------------- */
/*                                   Access                                   */
/* -------------------------------------------------------------------------- */

const detailByIdentifier = new Map(details.map((detail) => [detail.identifier, detail]));

export function getIssueDetail(issue: Issue): IssueDetail {
   return detailByIdentifier.get(issue.identifier) ?? buildFallbackDetail(issue);
}
