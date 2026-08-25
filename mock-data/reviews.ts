/**
 * Mock data of the Reviews feature (Linear-style PR reviews): list tabs
 * ("For you" / "Created"), and per-review Overview / Guide / Diff content.
 * Everything is fake and deterministic, on the LNDev UI storyline; the
 * `resolves` identifiers reference real issues from mock-data/issues.ts.
 */

export type ReviewStatus = 'open' | 'merged' | 'closed';
export type ReviewList = 'for-you' | 'created';

export type ReviewFileCategory = 'implementation' | 'tests';

export interface ReviewFileStat {
   name: string;
   path: string;
   additions: number;
   deletions: number;
   category: ReviewFileCategory;
}

export interface ReviewCommit {
   sha: string;
   message: string;
   timeAgo: string;
}

export interface DiffLine {
   type: 'context' | 'add' | 'del' | 'skip';
   /** New-file line number (omitted for del/skip). */
   number?: number;
   text?: string;
   /** For 'skip': how many unchanged lines are collapsed. */
   count?: number;
}

export interface FileDiff {
   name: string;
   path: string;
   additions: number;
   deletions: number;
   lines: DiffLine[];
}

export interface GuideSection {
   title: string;
   paragraphs: string[];
   /** File name shown as chips under the prose (stat = "+n -m"). */
   fileRefs: { name: string; path: string; stat: string }[];
   /** Which file diff to show next to the section. */
   diffName: string;
}

export interface ReviewVerdictRow {
   review: string;
   verdict: string;
   critical: string;
   high: string;
   medium: string;
}

export interface ReviewNote {
   author: string;
   timeAgo: string;
   verdictLine: string;
   profileLine: string;
   rows: ReviewVerdictRow[];
   footer?: string;
}

export interface Review {
   /** URL slug. */
   id: string;
   title: string;
   status: ReviewStatus;
   list: ReviewList;
   timeAgo: string;
   repo: string;
   prNumber: number;
   targetBranch: string;
   sourceBranch: string;
   additions: number;
   deletions: number;
   /** Issue this PR resolves (real identifier from mock-data/issues.ts). */
   resolves: { identifier: string; title: string };
   checksPassed: number;
   checksTotal: number;
   files: ReviewFileStat[];
   commits: ReviewCommit[];
   /** Description "Summary" bullets — `inline code` supported via backticks. */
   summary: string[];
   testPlan: { text: string; checked: boolean }[];
   deployment?: { project: string; state: string; action: string };
   reviewNote?: ReviewNote;
}

/* -------------------------------------------------------------------------- */
/*                                   Seeds                                    */
/* -------------------------------------------------------------------------- */

type FileSeed = [name: string, path: string, add: number, del: number, cat: ReviewFileCategory];

interface ReviewSeed {
   id: string;
   title: string;
   status: ReviewStatus;
   list: ReviewList;
   timeAgo: string;
   prNumber: number;
   branch: string;
   resolves: [string, string];
   files: FileSeed[];
   commits: [string, string, string][];
   summary: string[];
   testPlan: [string, boolean][];
}

const seeds: ReviewSeed[] = [
   /* ------------------------------- For you ------------------------------- */
   {
      id: 'fix-sheet-header-truncation-with-long-titles',
      title: 'fix(sheet): 长标题下表头截断 [LNUI-903]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '1小时前',
      prNumber: 412,
      branch: 'fix/lnui-903-sheet-header-truncation',
      resolves: ['LNUI-903', '修复长标题下 Sheet 头部截断'],
      files: [
         ['sheet.tsx', 'components/ui/sheet', 31, 6, 'implementation'],
         ['sheet-header.tsx', 'components/ui/sheet', 12, 2, 'implementation'],
         ['use-truncate.ts', 'hooks', 9, 0, 'implementation'],
         ['sheet.test.tsx', 'components/ui/__tests__', 44, 0, 'tests'],
         ['use-truncate.test.ts', 'hooks/__tests__', 21, 0, 'tests'],
      ],
      commits: [
         ['4c19ae2', 'fix(sheet): 将标题限制为两行', '1小时前'],
         ['b02d7f1', 'feat(hooks): 抽取可复用的 useTruncate hook', '1小时前'],
         ['9e441cc', 'fix(sheet): 评审轮 — 保持关闭按钮可及', '1小时前'],
      ],
      summary: [
         '缺陷：长标题的 Sheet 把关闭按钮挤出了表头 — 标题在 flex 行中没有 `min-width: 0`，于是表头溢出而不是截断。',
         '根因：`SheetHeader` 用 `flex` 布局标题与操作区，但从未约束标题列。标题上的截断类无效，因为 flex 项可以增长到超出容器。',
         '修复：标题单元格现在为 `min-w-0` 并做两行截断（`line-clamp-2`），新增 `useTruncate` hook 暴露文本是否真的被截断，从而可在 tooltip 中显示完整标题。覆盖对话框、侧边面板与移动端底部面板。',
      ],
      testPlan: [
         ['`sheet.test.tsx`：长标题截断为两行，关闭按钮保持可见', true],
         ['`use-truncate.test.ts`：溢出与尺寸变化时报告截断状态', true],
         ['完整测试套件：148 个文件 / 1912 个测试全部通过，`tsc --noEmit` 无错误', true],
      ],
   },
   {
      id: 'fix-dialog-title-id-collision-with-multiple-instances',
      title: 'fix(dialog): 多实例时标题 id 冲突 [LNUI-909]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '6小时前',
      prNumber: 409,
      branch: 'fix/lnui-909-dialog-title-id',
      resolves: ['LNUI-909', '修复多个 Dialog 实例的标题 id 冲突'],
      files: [
         ['dialog.tsx', 'components/ui/dialog', 18, 9, 'implementation'],
         ['use-stable-id.ts', 'hooks', 14, 0, 'implementation'],
         ['dialog.test.tsx', 'components/ui/__tests__', 37, 3, 'tests'],
      ],
      commits: [
         ['77aa310', 'fix(dialog): 标题 id 改为由 useId 派生', '6小时前'],
         ['d1905be', 'test(dialog): 同时挂载两个对话框时保持 id 不同', '6小时前'],
      ],
      summary: [
         '同时挂载的两个对话框共享硬编码的 `dialog-title` id，导致屏幕阅读器为第二个实例播报错误标题。',
         'id 现在通过一个小型 `useStableId` hook 由 React `useId` 派生，保持 SSR 与客户端的 id 一致。',
         '`aria-labelledby` 与 `aria-describedby` 始终指向各自实例的 id。',
      ],
      testPlan: [
         ['`dialog.test.tsx`：同时挂载的两个对话框暴露不同的标题 id', true],
         ['文档对话框页面 Axe 审计：0 违例', true],
      ],
   },
   {
      id: 'feat-pagination-compound-component-api',
      title: 'feat(pagination): 复合组件 API [LNUI-622]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '7小时前',
      prNumber: 405,
      branch: 'feat/lnui-622-pagination-compound',
      resolves: ['LNUI-622', '发布 Pagination 复合组件'],
      files: [
         ['pagination.tsx', 'components/ui/pagination', 96, 0, 'implementation'],
         ['use-pagination-range.ts', 'hooks', 38, 0, 'implementation'],
         ['pagination.test.tsx', 'components/ui/__tests__', 58, 0, 'tests'],
         ['pagination.stories.tsx', 'stories', 27, 0, 'tests'],
      ],
      commits: [
         ['ab8c1f0', 'feat(pagination): root、item、ellipsis 与 nav 子组件', '7小时前'],
         ['3f0de52', 'feat(hooks): 带边界的窗口化页码', '7小时前'],
      ],
      summary: [
         '新增 `Pagination` 复合组件：`Pagination.Root`、`.Item`、`.Previous`、`.Next` 与 `.Ellipsis`，使用现有按钮配方实现样式。',
         '`usePaginationRange` hook 计算窗口化页码列表（边界数 + 兄弟数），让标记保持由使用者完全控制。',
         '键盘与屏幕阅读器行为遵循 WAI-ARIA 分页模式（`nav` 地标 + `aria-current="page"`）。',
      ],
      testPlan: [
         ['`pagination.test.tsx`：页码范围窗口、边界与 aria 属性', true],
         ['Storybook：默认、紧凑与受控示例', true],
      ],
   },
   {
      id: 'feat-docs-search-by-prop-name-and-enum-values',
      title: 'feat(docs): 按属性名与枚举值搜索 [LNUI-911]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '1天前',
      prNumber: 398,
      branch: 'feat/lnui-911-docs-prop-search',
      resolves: ['LNUI-911', '按属性名和枚举值搜索文档'],
      files: [
         ['search-index.ts', 'docs/lib', 52, 11, 'implementation'],
         ['prop-table.tsx', 'docs/components', 24, 5, 'implementation'],
         ['search-index.test.ts', 'docs/lib/__tests__', 40, 0, 'tests'],
      ],
      commits: [
         ['58e2b91', 'feat(docs): 索引属性名与枚举值', '1天前'],
         ['c4417ad', 'feat(docs): 搜索命中深链到属性行', '1天前'],
      ],
      summary: [
         '文档搜索索引现在包含每个组件的属性名与枚举值，因此搜索 `sideOffset` 或 `"destructive"` 会命中正确的 API 表格。',
         '搜索命中直接深链到具体的属性行（滚动 + 高亮），而不是页面顶部。',
         '索引在编译时由驱动属性表的同一份 TypeScript 定义构建 — 无需手动同步。',
      ],
      testPlan: [
         ['`search-index.test.ts`：属性、枚举与别名均被索引', true],
         ['手动验证：`sideOffset`、`variant`、`"ghost"` 命中预期行', true],
      ],
   },
   {
      id: 'feat-combobox-multi-select-chips-inside-the-trigger',
      title: 'feat(combobox): 触发器内的多选标签 [LNUI-920]',
      status: 'open',
      list: 'for-you',
      timeAgo: '30分钟前',
      prNumber: 415,
      branch: 'feat/lnui-920-combobox-chips',
      resolves: ['LNUI-920', 'Combobox：触发器内的多选标签'],
      files: [
         ['combobox.tsx', 'components/ui/combobox', 74, 18, 'implementation'],
         ['chip-list.tsx', 'components/ui/combobox', 42, 0, 'implementation'],
         ['use-chip-overflow.ts', 'hooks', 27, 0, 'implementation'],
         ['combobox.test.tsx', 'components/ui/__tests__', 51, 4, 'tests'],
      ],
      commits: [
         ['7be4a90', 'feat(combobox): 将选中值渲染为可移除标签', '30分钟前'],
         ['c53f1d8', 'feat(combobox): 基于测量行高的 +n 溢出计数', '28分钟前'],
      ],
      summary: [
         '多选 Combobox 现在将选中项渲染为触发器内的可移除标签，而不是拼接字符串。',
         '`useChipOverflow` hook 测量标签行，并将多余标签折叠在 `+n` 计数器之后，使触发器高度永不增长。',
         '输入框为空时按 Backspace 会移除最后一个标签，与用户在邮件客户端中熟知的模式一致。',
      ],
      testPlan: [
         ['`combobox.test.tsx`：标签增删、溢出计数与 Backspace 行为', true],
         ['手动验证：启用 VoiceOver 的纯键盘选择', false],
      ],
   },
   {
      id: 'feat-form-async-validators-with-debounce-and-abort',
      title: 'feat(form): 带防抖与中断的异步校验器 [LNUI-777]',
      status: 'open',
      list: 'for-you',
      timeAgo: '45分钟前',
      prNumber: 414,
      branch: 'feat/lnui-777-async-validators',
      resolves: ['LNUI-777', 'Form：带防抖与中断的异步校验器'],
      files: [
         ['form.tsx', 'components/ui/form', 39, 11, 'implementation'],
         ['use-async-validator.ts', 'hooks', 58, 0, 'implementation'],
         ['use-async-validator.test.ts', 'hooks/__tests__', 63, 0, 'tests'],
      ],
      commits: [
         ['91d70aa', 'feat(form): 字段包装器上的异步校验插槽', '45分钟前'],
         ['0ce82b7', 'feat(hooks): 带 AbortController 的防抖校验', '40分钟前'],
      ],
      summary: [
         '字段接受异步 `validate` 函数；执行会防抖（默认 300ms），过期的执行会被 `AbortController` 取消。',
         '字段暴露 `validating` 状态，使用者无需自建跟踪即可渲染 spinner。',
         '除非中断来自更新的按键，否则校验失败会解析为字段错误。',
      ],
      testPlan: [
         ['`use-async-validator.test.ts`：防抖窗口、再次输入时中断、错误映射', true],
         ['手动验证：针对慢接口的用户名可用性演示', false],
      ],
   },
   {
      id: 'fix-progress-label-rounding-at-99-5-percent',
      title: 'fix(progress): 99.5% 时标签舍入 [LNUI-912]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '1天前',
      prNumber: 410,
      branch: 'fix/lnui-912-progress-rounding',
      resolves: ['LNUI-912', '修复 Progress 在 99.5% 时的标签舍入'],
      files: [
         ['progress.tsx', 'components/ui/progress', 12, 5, 'implementation'],
         ['format-percent.ts', 'lib', 14, 0, 'implementation'],
         ['progress.test.tsx', 'components/ui/__tests__', 24, 0, 'tests'],
      ],
      commits: [['5da11f3', 'fix(progress): 值真正完成前始终向下取整', '1天前']],
      summary: [
         '`Math.round` 从 99.5 起就显示「100%」，而进度条还没到头 — 长时间上传时标签会骗人。',
         '标签现在对低于 100 的值向下取整，只有在值真正达到最大值时才显示「100%」。',
      ],
      testPlan: [['`progress.test.tsx`：99.4 → 99%、99.9 → 99%、100 → 100%', true]],
   },
   {
      id: 'feat-spinner-size-and-stroke-tokens',
      title: 'feat(spinner): 尺寸与描边令牌 [LNUI-914]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '2天前',
      prNumber: 413,
      branch: 'feat/lnui-914-spinner-tokens',
      resolves: ['LNUI-914', '发布带尺寸与描边令牌的 Spinner'],
      files: [
         ['spinner.tsx', 'components/ui/spinner', 46, 0, 'implementation'],
         ['tokens.css', 'app', 9, 0, 'implementation'],
         ['spinner.stories.tsx', 'stories', 19, 0, 'tests'],
      ],
      commits: [
         ['e04c6b1', 'feat(spinner): 由尺寸/描边令牌驱动的 svg spinner', '2天前'],
         ['b7f309e', 'docs(spinner): 尺寸与 reduced-motion 说明', '2天前'],
      ],
      summary: [
         '新增 `Spinner` 组件，由令牌控制尺寸（`--spinner-size-*`、`--spinner-stroke-*`），让按钮、输入框与空状态在视觉上保持一致。',
         '遵循 `prefers-reduced-motion`：将旋转替换为轻微的不透明度脉冲。',
      ],
      testPlan: [
         ['Storybook：亮色与暗色下的 sm/md/lg 矩阵', true],
         ['手动验证：系统设置中的 reduced-motion 降级', true],
      ],
   },
   {
      id: 'feat-dialog-inert-background-instead-of-aria-hidden',
      title: 'feat(dialog): 用 inert 背景替代 aria-hidden 遍历 [LNUI-780]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '2天前',
      prNumber: 407,
      branch: 'feat/lnui-780-dialog-inert',
      resolves: ['LNUI-780', 'Dialog：用 inert 背景替代 aria-hidden 遍历'],
      files: [
         ['dialog.tsx', 'components/ui/dialog', 21, 34, 'implementation'],
         ['use-inert-others.ts', 'hooks', 32, 0, 'implementation'],
         ['dialog.test.tsx', 'components/ui/__tests__', 28, 6, 'tests'],
      ],
      commits: [
         ['a19c44d', 'feat(dialog): 对话框打开时将兄弟节点标记为 inert', '2天前'],
         ['4f80b23', 'chore(dialog): 删除递归的 aria-hidden 遍历', '2天前'],
      ],
      summary: [
         '打开对话框时过去会遍历 DOM 并在每个兄弟节点上打 `aria-hidden` — 大页面下很慢，且卸载时容易残留过期标记。',
         '后台子树现在通过 `useInertOthers` hook 标记原生 `inert` 属性，顺带免费阻止焦点与点击。',
         '遍历器及其清理簿记都被删除：−34 行棘手的代码。',
      ],
      testPlan: [
         ['`dialog.test.tsx`：打开期间后台焦点不可达，关闭后恢复', true],
         ['嵌套对话框演示 Axe 审计：0 违例', true],
      ],
   },
   {
      id: 'fix-combobox-popover-width-in-grid-cells',
      title: 'fix(combobox): 触发器位于 grid 单元格时的 popover 宽度 [LNUI-796]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '3天前',
      prNumber: 406,
      branch: 'fix/lnui-796-combobox-popover-width',
      resolves: ['LNUI-796', '修复触发器位于 grid 单元格中时 Combobox popover 宽度'],
      files: [
         ['combobox.tsx', 'components/ui/combobox', 11, 6, 'implementation'],
         ['combobox.test.tsx', 'components/ui/__tests__', 17, 0, 'tests'],
      ],
      commits: [['2c96e07', 'fix(combobox): 测量触发器盒子而非 grid 轨道', '3天前']],
      summary: [
         '在 CSS grid 单元格内，popover 匹配的是网格轨道宽度而不是触发器，导致列表比输入框还宽。',
         'popover 现在从测量到的触发器盒子读取 `--radix-popper-anchor-width`，因此固有宽度与拉伸的触发器都能对齐。',
      ],
      testPlan: [['`combobox.test.tsx`：grid 夹具内 popover 宽度等于触发器宽度', true]],
   },
   {
      id: 'fix-toast-region-announces-politely',
      title: 'fix(toast): 用礼貌语气而非命令语气播报 [LNUI-798]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '3天前',
      prNumber: 404,
      branch: 'fix/lnui-798-toast-polite',
      resolves: ['LNUI-798', 'Toast 区域用礼貌语气而非命令语气播报'],
      files: [
         ['toast.tsx', 'components/ui/toast', 9, 7, 'implementation'],
         ['toast.test.tsx', 'components/ui/__tests__', 15, 2, 'tests'],
      ],
      commits: [['d7b5e12', 'fix(toast): 默认将实时区域设为 polite', '3天前']],
      summary: [
         '成功 toast 会在播报中途打断屏幕阅读器，因为实时区域默认是 `assertive`。',
         '该区域现默认 `polite`；只有标记 `urgent`（破坏性失败）的 toast 才保留 assertive 通道。',
      ],
      testPlan: [
         ['`toast.test.tsx`：不同 toast 意图的 aria-live 值', true],
         ['手动验证：成功 toast 时 VoiceOver 不再打断当前播报', true],
      ],
   },
   {
      id: 'feat-button-loading-prop-with-spinner-replacement',
      title: 'feat(button): 带 spinner 替换的 loading 属性 [LNUI-750]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '4天前',
      prNumber: 403,
      branch: 'feat/lnui-750-button-loading',
      resolves: ['LNUI-750', '为 Button 添加 loading 属性，替换为 spinner'],
      files: [
         ['button.tsx', 'components/ui/button', 26, 4, 'implementation'],
         ['button.test.tsx', 'components/ui/__tests__', 31, 0, 'tests'],
         ['button.stories.tsx', 'stories', 14, 0, 'tests'],
      ],
      commits: [
         ['6e21af7', 'feat(button): loading 状态将前导图标换成 spinner', '4天前'],
         ['98cd034', 'feat(button): loading 时保持测量宽度', '4天前'],
      ],
      summary: [
         '`<Button loading>` 禁用交互，将前导图标替换为新的 `Spinner`，并通过 `aria-busy` 播报忙碌状态。',
         '加载时按钮保持测量到的宽度，因此标签变短时相邻控件不会移动。',
      ],
      testPlan: [
         ['`button.test.tsx`：aria-busy、指针事件、加载时宽度锁定', true],
         ['Storybook：跨变体与尺寸的 loading 矩阵', true],
      ],
   },
   {
      id: 'feat-avatar-fallback-gradient-from-user-id-hash',
      title: 'feat(avatar): 由用户 id 哈希派生的回退渐变 [LNUI-763]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '5天前',
      prNumber: 401,
      branch: 'feat/lnui-763-avatar-gradient',
      resolves: ['LNUI-763', 'Avatar：根据用户 id 哈希生成回退渐变'],
      files: [
         ['avatar.tsx', 'components/ui/avatar', 18, 3, 'implementation'],
         ['gradient-hash.ts', 'lib', 22, 0, 'implementation'],
         ['gradient-hash.test.ts', 'lib/__tests__', 20, 0, 'tests'],
      ],
      commits: [['f3d8c51', 'feat(avatar): 确定性双色渐变回退', '5天前']],
      summary: [
         '回退头像现在渲染由用户 id 哈希生成的确定性双色 OKLCH 渐变，而不是平面灰色圆。',
         '色相配对从精选的色环中挑选，保证每个生成的渐变与白色字母的对比度都 ≥ 4.5:1。',
      ],
      testPlan: [['`gradient-hash.test.ts`：每个 id 输出稳定，色环对比度下限达标', true]],
   },
   {
      id: 'feat-popover-opt-in-modal-mode-with-focus-containment',
      title: 'feat(popover): 可选弹层模式并限制焦点 [LNUI-766]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '5天前',
      prNumber: 400,
      branch: 'feat/lnui-766-popover-modal',
      resolves: ['LNUI-766', 'Popover：可选弹层模式并限制焦点'],
      files: [
         ['popover.tsx', 'components/ui/popover', 24, 8, 'implementation'],
         ['popover.test.tsx', 'components/ui/__tests__', 29, 0, 'tests'],
      ],
      commits: [['0b64e88', 'feat(popover): modal 属性限制焦点并阻止外部滚动', '5天前']],
      summary: [
         '`<Popover modal>` 将 Tab 焦点限制在面板内，阻止外部滚动，并在关闭时把焦点恢复到触发器。',
         '默认的非弹层行为保持不变 — 只有在设置该属性时才挂载焦点限制。',
      ],
      testPlan: [['`popover.test.tsx`：焦点循环、滚动锁定、关闭时焦点恢复', true]],
   },
   {
      id: 'feat-scroll-area-shadows-via-scroll-driven-animations',
      title: 'feat(scroll-area): 通过滚动驱动动画实现滚动阴影 [LNUI-760]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '6天前',
      prNumber: 399,
      branch: 'feat/lnui-760-scroll-shadows',
      resolves: ['LNUI-760', 'Scroll area：通过滚动驱动动画实现滚动阴影'],
      files: [
         ['scroll-area.tsx', 'components/ui/scroll-area', 16, 2, 'implementation'],
         ['scroll-shadows.css', 'components/ui/scroll-area', 34, 0, 'implementation'],
         ['scroll-area.stories.tsx', 'stories', 16, 0, 'tests'],
      ],
      commits: [
         ['c81f2ad', 'feat(scroll-area): 仅用 CSS + animation-timeline 实现边缘阴影', '6天前'],
      ],
      summary: [
         '边缘阴影现在纯用 CSS 的 `animation-timeline: scroll()` 淡入淡出 — JS 滚动监听器及其状态更新都被移除。',
         '不支持滚动驱动动画的浏览器在 `@supports` 保护下保留静态阴影，不会出问题。',
      ],
      testPlan: [
         ['Storybook：双轴阴影与嵌套滚动区域', true],
         ['手动验证：Safari 降级渲染静态变体', true],
      ],
   },
   {
      id: 'chore-replace-lodash-debounce-with-in-house-scheduler',
      title: 'chore(lib): 用内部调度器替换 lodash.debounce [LNUI-782]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '1周前',
      prNumber: 397,
      branch: 'chore/lnui-782-debounce-scheduler',
      resolves: ['LNUI-782', '用内部调度器替换 lodash.debounce'],
      files: [
         ['scheduler.ts', 'lib', 41, 0, 'implementation'],
         ['use-debounced-value.ts', 'hooks', 8, 12, 'implementation'],
         ['scheduler.test.ts', 'lib/__tests__', 47, 0, 'tests'],
      ],
      commits: [
         ['33e91b0', 'feat(lib): 支持 leading/trailing 的轻量防抖/节流调度器', '1周前'],
         ['aa07d95', 'chore: 移除 lodash.debounce 依赖', '1周前'],
      ],
      summary: [
         '一个 40 行的调度器覆盖了所有防抖/节流调用点，`lodash.debounce`（及其 24 KB 的传递安装体积）就此移除。',
         '定时器通过共享注册表清理，修复了两处泄漏：此前已卸载组件仍会保留挂起的尾调用。',
      ],
      testPlan: [
         ['`scheduler.test.ts`：leading/trailing 矩阵、销毁时取消', true],
         ['打包检查：客户端依赖图中无 lodash 块', true],
      ],
   },
   {
      id: 'fix-button-gap-with-conditional-icon-only-child',
      title: 'fix(button): 仅图标子元素为条件渲染时间距塌陷 [LNUI-797]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '1周前',
      prNumber: 394,
      branch: 'fix/lnui-797-button-gap',
      resolves: ['LNUI-797', 'Button：仅图标子元素为条件渲染时间距塌陷'],
      files: [
         ['button.tsx', 'components/ui/button', 7, 4, 'implementation'],
         ['button.test.tsx', 'components/ui/__tests__', 13, 0, 'tests'],
      ],
      commits: [['b4a67c2', 'fix(button): 用 gap 工具类替代子元素外边距', '1周前']],
      summary: [
         '条件渲染的 `{icon && <Icon />}` 子元素输出 `false` 时，图标的外边距仍作用在标签上，产生畸形的按钮。',
         '间距从每个子元素的外边距改为 flex 行的 `gap`，因此不存在的子元素不会产生任何影响。',
      ],
      testPlan: [['`button.test.tsx`：有无条件图标时标签均居中', true]],
   },
   {
      id: 'feat-table-monospace-numeric-cell-variant',
      title: 'feat(table): 等宽数字单元格变体 [LNUI-761]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '8天前',
      prNumber: 393,
      branch: 'feat/lnui-761-table-numeric-cells',
      resolves: ['LNUI-761', '为 Table 单元格添加等宽数字变体'],
      files: [
         ['table.tsx', 'components/ui/table', 15, 2, 'implementation'],
         ['table.test.tsx', 'components/ui/__tests__', 12, 0, 'tests'],
         ['table.stories.tsx', 'stories', 11, 0, 'tests'],
      ],
      commits: [['9f0b3e6', 'feat(table): 等宽数字 + 右对齐的数值单元格', '8天前']],
      summary: [
         '`<Table.Cell numeric>` 将内容右对齐并应用 `font-variant-numeric: tabular-nums`，让数字列对齐。',
         '表头单元格从所在列继承对齐方式，排序图标始终贴合标签。',
      ],
      testPlan: [['Storybook：跨行小数对齐的定价表', true]],
   },
   {
      id: 'feat-skip-to-content-link-helper-for-app-shells',
      title: 'feat(a11y): 应用外壳的跳过内容链接辅助 [LNUI-765]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '10天前',
      prNumber: 391,
      branch: 'feat/lnui-765-skip-link',
      resolves: ['LNUI-765', '为应用外壳添加跳过内容链接辅助函数'],
      files: [
         ['skip-link.tsx', 'components/layout', 29, 0, 'implementation'],
         ['skip-link.test.tsx', 'components/layout/__tests__', 18, 0, 'tests'],
      ],
      commits: [['1d5c0a9', 'feat(a11y): 聚焦时显现的视觉隐藏跳过链接', '10天前']],
      summary: [
         '`<SkipLink targetId>` 渲染视觉隐藏的锚点，首次按 Tab 时出现并将焦点跳过导航外壳。',
         '目标元素获得临时的 `tabindex="-1"`，让焦点在所有浏览器中都可靠落位，随后在失焦时自行清理。',
      ],
      testPlan: [['`skip-link.test.tsx`：聚焦时显现，并把焦点移到目标区域', true]],
   },
   {
      id: 'feat-tabs-lazy-mount-panels-with-keep-mounted-opt-in',
      title: 'feat(tabs): 按需挂载面板，提供 keepMounted 选项 [LNUI-751]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '12天前',
      prNumber: 390,
      branch: 'feat/lnui-751-tabs-lazy-mount',
      resolves: ['LNUI-751', 'Tabs：按需挂载面板，提供 keepMounted 选项'],
      files: [
         ['tabs.tsx', 'components/ui/tabs', 23, 6, 'implementation'],
         ['tabs.test.tsx', 'components/ui/__tests__', 26, 0, 'tests'],
      ],
      commits: [
         ['74ab1c3', 'feat(tabs): 仅在首次激活时挂载面板', '12天前'],
         ['e2d9075', 'feat(tabs): keepMounted 为已访问面板保留状态', '12天前'],
      ],
      summary: [
         '面板现在在首次激活时才挂载，而不是一次性全部挂载 — 较重的标签内容不再预先付出成本。',
         '`keepMounted` 将已访问面板保留在树中（隐藏），因此表单与滚动位置在切换标签后仍保留。',
      ],
      testPlan: [['`tabs.test.tsx`：未访问面板不在 DOM 中，已访问状态保留', true]],
   },
   {
      id: 'feat-toolbar-overflow-priority-api',
      title: 'feat(toolbar): 溢出优先级 API [LNUI-916]',
      status: 'merged',
      list: 'for-you',
      timeAgo: '2周前',
      prNumber: 389,
      branch: 'feat/lnui-916-toolbar-overflow',
      resolves: ['LNUI-916', '发布 Toolbar 溢出优先级 API'],
      files: [
         ['toolbar.tsx', 'components/ui/toolbar', 55, 9, 'implementation'],
         ['use-overflow-priority.ts', 'hooks', 44, 0, 'implementation'],
         ['toolbar.test.tsx', 'components/ui/__tests__', 39, 0, 'tests'],
      ],
      commits: [
         ['8c33d17', 'feat(toolbar): 按优先级折叠进溢出菜单', '2周前'],
         ['57e9f04', 'feat(hooks): 基于 ResizeObserver 的溢出测量', '2周前'],
      ],
      summary: [
         '工具栏项声明 `priority`；空间不足时，优先级最低的项折叠进溢出菜单而不是换行。',
         '测量通过单个 `ResizeObserver` 完成，并一次性应用折叠状态，因此窄视口不会闪烁。',
      ],
      testPlan: [
         ['`toolbar.test.tsx`：各断点下折叠顺序遵循优先级', true],
         ['Storybook：320/768/1280 px 的编辑器工具栏演示', true],
      ],
   },
   {
      id: 'chore-custom-scrollbar-styling-fallback-for-firefox',
      title: 'chore(scroll-area): Firefox 自定义滚动条样式降级 [LNUI-919]',
      status: 'closed',
      list: 'for-you',
      timeAgo: '9天前',
      prNumber: 387,
      branch: 'chore/lnui-919-scrollbar-fallback',
      resolves: ['LNUI-919', 'Firefox 自定义滚动条样式降级'],
      files: [
         ['scroll-area.tsx', 'components/ui/scroll-area', 19, 5, 'implementation'],
         ['scrollbar-fallback.css', 'components/ui/scroll-area', 26, 0, 'implementation'],
      ],
      commits: [['41f8d02', 'chore(scroll-area): scrollbar-width/color 降级样式', '9天前']],
      summary: [
         '尝试 `scrollbar-width`/`scrollbar-color` 降级方案，让 Firefox 用户在没有自定义滑块的情况下获得细条主题滚动条。',
         '已关闭：Firefox 133 提供了等效 `::-webkit-scrollbar` 的样式支持，共享样式现已覆盖该场景，无需降级层。',
      ],
      testPlan: [['已被原生支持取代 — 在 Firefox 133 nightly 上验证过', false]],
   },
   {
      id: 'chore-migrate-the-docs-playground-to-sandpack-3',
      title: 'chore(docs): 将演练场迁移到 Sandpack 3 [LNUI-772]',
      status: 'closed',
      list: 'for-you',
      timeAgo: '2周前',
      prNumber: 385,
      branch: 'chore/lnui-772-sandpack-3',
      resolves: ['LNUI-772', '将文档演练场迁移到 Sandpack 3'],
      files: [
         ['playground.tsx', 'docs/components', 48, 37, 'implementation'],
         ['sandpack-theme.ts', 'docs/lib', 22, 14, 'implementation'],
         ['playground.test.tsx', 'docs/components/__tests__', 20, 8, 'tests'],
      ],
      commits: [
         ['66e0b21', 'chore(docs): 将 sandpack-react 升级到 v3 并适配主题 API', '2周前'],
         ['09fd7c8', 'fix(docs): 为新 sandpack 运行时固定打包器 URL', '2周前'],
      ],
      summary: [
         '将文档演练场升级到 Sandpack 3，以获得更快的 esbuild 打包器与新的文件标签 API。',
         '未合并即关闭：v3.0.2 使内嵌预览中 CSS 模块的 HMR 回退 — 上游修复落地后重新打开。',
      ],
      testPlan: [['阻塞于上游 — 演示应用中已复现 HMR 回归', false]],
   },
   {
      id: 'experiment-inline-critical-css-for-the-docs-home',
      title: 'experiment(docs): 文档首页内联关键 CSS [LNUI-918]',
      status: 'closed',
      list: 'for-you',
      timeAgo: '3周前',
      prNumber: 384,
      branch: 'experiment/lnui-918-critical-css',
      resolves: ['LNUI-918', '文档首页内联关键 CSS 实验'],
      files: [
         ['critical-css.ts', 'docs/lib', 61, 0, 'implementation'],
         ['layout.tsx', 'app', 12, 3, 'implementation'],
      ],
      commits: [['d02c9f4', 'experiment(docs): 构建时提取并内联首屏 CSS', '3周前']],
      summary: [
         '构建时提取并在文档首页内联约 6 KB 首屏 CSS，以测试对 FCP 的影响。',
         '测量后关闭：FCP 在 p75 仅提升 40ms，而每个页面的 HTML 负载都在增长 — 不值得为此增加流水线复杂度。',
      ],
      testPlan: [['一周预览流量的 Lighthouse + CrUX 对比', true]],
   },
   /* ------------------------------- Created ------------------------------- */
   {
      id: 'fix-slider-keyboard-step-with-fractional-precision',
      title: 'fix(slider): 带小数精度的键盘步进 [LNUI-900]',
      status: 'merged',
      list: 'created',
      timeAgo: '2小时前',
      prNumber: 411,
      branch: 'fix/lnui-900-slider-fractional-step',
      resolves: ['LNUI-900', '修复 Slider 带小数精度的键盘步进'],
      files: [
         ['slider.tsx', 'components/ui/slider', 22, 8, 'implementation'],
         ['decimal.ts', 'lib', 16, 0, 'implementation'],
         ['slider.test.tsx', 'components/ui/__tests__', 33, 0, 'tests'],
      ],
      commits: [
         ['91b3e07', 'fix(slider): 键盘步进按步进精度取整', '2小时前'],
         ['12c88d4', 'feat(lib): 小数安全的 add/clamp 辅助函数', '2小时前'],
      ],
      summary: [
         '`step={0.1}` 的滑块连续按几次方向键后，会累积浮点噪声（`0.30000000000000004`）。',
         '步进现在使用小数安全辅助函数，按 `step` 属性的精度取整。',
         '同一批辅助函数还对 `min`/`max` 做钳制，让滑块总能精确到达两端边界。',
      ],
      testPlan: [
         ['`slider.test.tsx`：0.1 步进连续 100 次按键保持精确', true],
         ['`decimal.test.ts` 由 lib 测试套件覆盖', true],
      ],
   },
   {
      id: 'fix-dropdown-checkbox-item-icon-alignment-in-rtl',
      title: 'fix(dropdown): RTL 下复选框项图标对齐 [LNUI-901]',
      status: 'merged',
      list: 'created',
      timeAgo: '6小时前',
      prNumber: 408,
      branch: 'fix/lnui-901-dropdown-rtl',
      resolves: ['LNUI-901', 'Dropdown：RTL 下复选框项图标对齐'],
      files: [
         ['dropdown-menu.tsx', 'components/ui/dropdown-menu', 14, 7, 'implementation'],
         ['dropdown-menu.test.tsx', 'components/ui/__tests__', 19, 0, 'tests'],
      ],
      commits: [['6d02c11', 'fix(dropdown): 复选框项的逻辑内边距', '6小时前']],
      summary: [
         '下拉菜单中的复选框与单选选项使用物理 `padding-left`，导致 RTL 地区中勾选指示器与标签重叠。',
         '内边距与指示器插槽现在使用逻辑属性（`padding-inline-start`、`inset-inline-start`）。',
      ],
      testPlan: [['`dropdown-menu.test.tsx`：`dir="rtl"` 下指示器位置', true]],
   },
   {
      id: 'feat-theme-reduce-hydration-payload-of-the-theme-script',
      title: 'feat(theme): 减小主题脚本水合负载 [LNUI-905]',
      status: 'merged',
      list: 'created',
      timeAgo: '1天前',
      prNumber: 402,
      branch: 'feat/lnui-905-theme-script-payload',
      resolves: ['LNUI-905', '通过内联减小主题脚本的水合负载'],
      files: [
         ['theme-script.ts', 'lib/theme', 28, 41, 'implementation'],
         ['theme-provider.tsx', 'components/layout', 9, 12, 'implementation'],
         ['theme-script.test.ts', 'lib/theme/__tests__', 26, 0, 'tests'],
      ],
      commits: [
         ['e77f21a', 'feat(theme): 内联压缩引导脚本', '1天前'],
         ['0b1349c', 'chore(theme): 移除运行时存储监听', '1天前'],
      ],
      summary: [
         '主题引导现在是 312 字节的内联脚本，而不是水合组件 — 不再闪现错误主题，首屏加载少约 4 KB JavaScript。',
         '脚本只读取一次 `localStorage`；跨标签页同步移到水合后挂载的懒监听器上。',
      ],
      testPlan: [
         ['`theme-script.test.ts`：系统/亮色/暗色解析矩阵', true],
         ['Lighthouse：TBT 不变，文档首页 LCP -80 ms', true],
      ],
   },
   {
      id: 'fix-calendar-disabled-matcher-for-date-ranges',
      title: 'fix(calendar): 日期范围的禁用匹配器 [LNUI-906]',
      status: 'merged',
      list: 'created',
      timeAgo: '4天前',
      prNumber: 396,
      branch: 'fix/lnui-906-calendar-disabled-ranges',
      resolves: ['LNUI-906', '修复 Calendar 日期范围的禁用匹配器'],
      files: [
         ['calendar.tsx', 'components/ui/calendar', 17, 10, 'implementation'],
         ['date-matchers.ts', 'lib', 21, 4, 'implementation'],
         ['calendar.test.tsx', 'components/ui/__tests__', 29, 0, 'tests'],
      ],
      commits: [['a3c90d8', 'fix(calendar): 禁用匹配器中的包含式范围边界', '4天前']],
      summary: [
         '`disabled={{ from, to }}` 匹配器排除了 `to` 这一天，因为时区归一化后比较使用了排他边界。',
         '范围匹配器现在在日历时区中归一化到当日零点，并进行包含式比较。',
      ],
      testPlan: [['`calendar.test.tsx`：跨 DST 时 from/to 边界被禁用', true]],
   },
   {
      id: 'feat-tabs-home-and-end-keys-jump-to-first-and-last-tab',
      title: 'feat(tabs): Home 和 End 键跳到首尾标签 [LNUI-908]',
      status: 'merged',
      list: 'created',
      timeAgo: '4天前',
      prNumber: 395,
      branch: 'feat/lnui-908-tabs-home-end',
      resolves: ['LNUI-908', 'Tabs：Home 和 End 键跳到第一个和最后一个标签'],
      files: [
         ['tabs.tsx', 'components/ui/tabs', 15, 3, 'implementation'],
         ['tabs.test.tsx', 'components/ui/__tests__', 22, 0, 'tests'],
      ],
      commits: [['f5510b9', 'feat(tabs): Home/End 循环焦点', '4天前']],
      summary: [
         '`Home` 和 `End` 现在将焦点（自动模式下还包括选中）移到第一个和最后一个可用标签，符合 WAI-ARIA 标签页模式。',
         '两个方向的循环都会跳过禁用标签。',
      ],
      testPlan: [['`tabs.test.tsx`：带禁用边界的 Home/End', true]],
   },
   {
      id: 'fix-command-escape-closes-nested-pages-before-the-dialog',
      title: 'fix(command): Escape 先关闭嵌套页再关闭对话框 [LNUI-910]',
      status: 'merged',
      list: 'created',
      timeAgo: '5天前',
      prNumber: 392,
      branch: 'fix/lnui-910-command-escape',
      resolves: ['LNUI-910', 'Command menu：Escape 先关闭嵌套页再关闭对话框'],
      files: [
         ['command.tsx', 'components/ui/command', 19, 6, 'implementation'],
         ['command.test.tsx', 'components/ui/__tests__', 25, 0, 'tests'],
      ],
      commits: [['08d4b72', 'fix(command): Escape 弹出页面栈', '5天前']],
      summary: [
         '在嵌套命令页内按 Escape 会关闭整个面板，而不是返回上一级。',
         'Escape 现在先弹出页面栈，只有位于根页面时才关闭对话框；`stopPropagation` 让外层对话框保持打开。',
      ],
      testPlan: [['`command.test.tsx`：嵌套页 → 根页 → 关闭的序列', true]],
   },
   {
      id: 'feat-skeleton-match-the-line-height-rhythm-of-text-presets',
      title: 'feat(skeleton): 与 Text 预设行高节奏一致 [LNUI-907]',
      status: 'merged',
      list: 'created',
      timeAgo: '1周前',
      prNumber: 388,
      branch: 'feat/lnui-907-skeleton-rhythm',
      resolves: ['LNUI-907', 'Skeleton：与 Text 预设的行高节奏一致'],
      files: [
         ['skeleton.tsx', 'components/ui/skeleton', 26, 9, 'implementation'],
         ['skeleton.stories.tsx', 'stories', 18, 0, 'tests'],
      ],
      commits: [['b99d0c3', 'feat(skeleton): 感知文本预设的行骨架', '1周前']],
      summary: [
         '`Skeleton.Text` 接受与 `Text` 相同的 `preset` 属性，渲染的高度与间距与真实行盒一致 — 内容到达时无布局偏移。',
         '默认将最后一行缩短到 60%，使其读起来像段落。',
      ],
      testPlan: [['Storybook：骨架屏与加载后文本并排对比，零偏移', true]],
   },
   {
      id: 'fix-accordion-animate-height-with-css-grid-rows',
      title: 'fix(accordion): 用 CSS grid 行动画化高度 [LNUI-560]',
      status: 'merged',
      list: 'created',
      timeAgo: '1周前',
      prNumber: 386,
      branch: 'fix/lnui-560-accordion-grid-rows',
      resolves: ['LNUI-560', 'Accordion：用 CSS grid 行而非 max-height 动画化高度'],
      files: [
         ['accordion.tsx', 'components/ui/accordion', 12, 18, 'implementation'],
         ['accordion.test.tsx', 'components/ui/__tests__', 16, 2, 'tests'],
      ],
      commits: [['2ac77e5', 'fix(accordion): grid-template-rows 过渡', '1周前']],
      summary: [
         '开合动画使用硬编码的 `max-height`，会裁剪超高内容，且对短内容过渡不正确。',
         '内容现在动画化 `grid-template-rows: 0fr → 1fr`，免费跟踪真实高度，并去掉了魔法数字。',
      ],
      testPlan: [['`accordion.test.tsx`：打开时高内容不被裁剪', true]],
   },
   {
      id: 'do-not-merge-chore-preview-design-tokens-dry-run',
      title: '[请勿合并] chore(preview): 设计令牌试运行 — 预演链接',
      status: 'closed',
      list: 'created',
      timeAgo: '12天前',
      prNumber: 371,
      branch: 'chore/preview-design-tokens-dry-run',
      resolves: ['LNUI-807', '高对比度主题预设'],
      files: [
         ['tokens.css', 'app', 210, 0, 'implementation'],
         ['tokens-preview.tsx', 'docs/components', 44, 0, 'implementation'],
      ],
      commits: [['5f3310a', 'chore(preview): 生成令牌表供评审', '12天前']],
      summary: [
         '用于在预演环境预览生成的高对比度令牌表的临时分支 — 仅为设计评审获取部署链接。',
         '评审完成后未合并即关闭；实际工作将随 LNUI-807 落地。',
      ],
      testPlan: [['仅用于预览部署 — 不打算合并', false]],
   },
];

/* -------------------------------------------------------------------------- */
/*                        Deterministic detail expansion                      */
/* -------------------------------------------------------------------------- */

const seedNumber = (value: string): number =>
   value.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 9973, 11);

/** Deterministic, plausible-looking TypeScript diff for a file. */
export function getReviewFileDiff(review: Review, file: ReviewFileStat): FileDiff {
   const seed = seedNumber(review.id + file.name);
   const base = file.name.replace(/\.(test|stories)?\.?(tsx?|css)$/, '');
   const camel = base.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
   const isTest = file.category === 'tests';
   const lines: DiffLine[] = [];
   let n = 1;
   const push = (type: DiffLine['type'], text: string) => {
      lines.push({ type, number: type === 'del' ? undefined : n, text });
      if (type !== 'del') n += 1;
   };

   const pascal = camel[0].toUpperCase() + camel.slice(1);
   const isHook = base.startsWith('use-');
   /** Function name of the file (hooks keep their camelCase name). */
   const fn = isHook ? camel : pascal;
   const stateHook = isHook ? `${camel}State` : `use${pascal}State`;

   if (isTest) {
      push('context', "import { describe, expect, it } from 'vitest';");
      push('context', "import { render, screen } from '@testing-library/react';");
      push('add', `import { ${fn} } from '../${base}';`);
      push('context', '');
      push('context', `describe('${fn}', () => {`);
      push(
         'add',
         `   it('${review.summary[0]
            ?.slice(0, 48)
            .toLowerCase()
            .replace(/[`'".]/g, '')}…', () => {`
      );
      push('add', `      render(<${fn} />);`);
      push(
         'add',
         `      expect(screen.getByRole('${seed % 2 ? 'dialog' : 'button'}')).toBeInTheDocument();`
      );
      push('add', '   });');
      push('add', '');
      push('add', `   it('对默认属性保持原有行为', () => {`);
      push('add', `      const { container } = render(<${fn} />);`);
      push('add', '      expect(container.firstChild).toMatchSnapshot();');
      push('add', '   });');
      push('context', '});');
      lines.push({ type: 'skip', count: 18 + (seed % 30) });
   } else {
      push('context', "'use client';");
      push('context', '');
      push('context', "import { cn } from '@/lib/utils';");
      push('add', `import { ${stateHook} } from './${isHook ? base : `use-${base}`}-state';`);
      push('context', '');
      push('context', `export function ${fn}(props: ${pascal}Props) {`);
      push('del', '   const state = legacyState(props);');
      push('add', `   const state = ${stateHook}(props);`);
      push('context', '');
      push('add', '   // 测量到的尺寸以内容盒为基准，嵌套滚动');
      push('add', '   // 容器不再在首帧报告过期的高度。');
      push('add', `   const measured = state.measure({ clamp: ${seed % 2 ? 'true' : 'false'} });`);
      push('context', '');
      push('context', '   return (');
      push(
         'add',
         `      <div className={cn('relative min-w-0', props.className)} data-slot="${base}">`
      );
      push('context', '         {props.children}');
      push('context', '      </div>');
      push('context', '   );');
      push('context', '}');
      lines.push({ type: 'skip', count: 24 + (seed % 40) });
   }

   return {
      name: file.name,
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      lines,
   };
}

/** Guide sections: one per implementation file (max 2), prose from the summary. */
export function getReviewGuide(review: Review): GuideSection[] {
   const implementation = review.files.filter((file) => file.category === 'implementation');
   const sections = implementation.slice(0, 2).map((file, index) => {
      const others = review.files.filter((candidate) => candidate !== file).slice(0, 3);
      return {
         title:
            index === 0
               ? (review.summary[0]?.split(/[—.:]/)[0].replace(/^Bug/, '修复缺陷') ?? review.title)
               : `接入 ${file.name}`,
         paragraphs: [
            review.summary[index] ?? review.summary[0] ?? '',
            review.summary[index + 1] ?? '以下所列测试覆盖了此次变更。',
         ],
         fileRefs: [
            {
               name: file.name,
               path: file.path,
               stat: `+${file.additions}${file.deletions ? ` -${file.deletions}` : ''}`,
            },
            ...others.map((other) => ({
               name: other.name,
               path: other.path,
               stat: `+${other.additions}${other.deletions ? ` -${other.deletions}` : ''}`,
            })),
         ],
         diffName: file.name,
      };
   });
   return sections;
}

/* -------------------------------------------------------------------------- */
/*                                  Reviews                                   */
/* -------------------------------------------------------------------------- */

/** Agent verdict variants, picked deterministically per review. */
const REVIEW_NOTES: Omit<ReviewNote, 'author' | 'timeAgo'>[] = [
   {
      verdictLine:
         '✅ 通过 — 所有选定评审均通过（0 严重，0 高）。架构层面的高优先级问题已在分支内修复，并通过变异测试复验。',
      profileLine:
         '基于真实 diff 计算评估（dev-flow 阶段 4.5）：逻辑 + 性能 + 架构。安全已跳过（无认证面 — 仅 UI 渲染）。',
      rows: [
         {
            review: '逻辑',
            verdict: '✅ 通过',
            critical: '0',
            high: '0',
            medium: '2（1 已修复，1 延期）',
         },
         {
            review: '性能',
            verdict: '✅ 通过',
            critical: '0',
            high: '0',
            medium: '1（历史遗留，延期）',
         },
         {
            review: '架构',
            verdict: '✅ 通过（原为阻塞，已修复）',
            critical: '0',
            high: '0 → 已修复',
            medium: '2（延期）',
         },
         { review: '安全', verdict: '⏭️ 已跳过', critical: '—', high: '—', medium: '—' },
      ],
      footer: '评审后已修复：回归面现在由测试断言 — 一旦破坏会明显报错，而不是静默劣化。',
   },
   {
      verdictLine: '✅ 通过 — 首轮即干净通过（0 严重，0 高，1 中延期）。',
      profileLine:
         '基于真实 diff 计算评估（dev-flow 阶段 4.5）：逻辑 + 无障碍 + 性能。安全已跳过（未触及数据边界）。',
      rows: [
         { review: '逻辑', verdict: '✅ 通过', critical: '0', high: '0', medium: '0' },
         {
            review: '无障碍',
            verdict: '✅ 通过',
            critical: '0',
            high: '0',
            medium: '1（延期）',
         },
         { review: '性能', verdict: '✅ 通过', critical: '0', high: '0', medium: '0' },
         { review: '安全', verdict: '⏭️ 已跳过', critical: '—', high: '—', medium: '—' },
      ],
      footer: '延期的中优先级问题已作为后续工单跟踪；未带测试的行为变更不会发布。',
   },
   {
      verdictLine: '✅ 通过 — 一轮修复后通过：第一轮发现的逻辑高优先级问题已在分支内修复并复验。',
      profileLine:
         '基于真实 diff 计算评估（dev-flow 阶段 4.5）：逻辑 + 架构。性能与安全已跳过（叶子级 UI 变更）。',
      rows: [
         {
            review: '逻辑',
            verdict: '✅ 通过（原为阻塞，已修复）',
            critical: '0',
            high: '1 → 已修复',
            medium: '1（已修复）',
         },
         {
            review: '架构',
            verdict: '✅ 通过',
            critical: '0',
            high: '0',
            medium: '1（延期）',
         },
         { review: '性能', verdict: '⏭️ 已跳过', critical: '—', high: '—', medium: '—' },
         { review: '安全', verdict: '⏭️ 已跳过', critical: '—', high: '—', medium: '—' },
      ],
      footer: '第二轮 diff 已从头重新评估：修复并未扩大评审面。',
   },
];

export const reviews: Review[] = seeds.map((seed) => {
   const noteSeed = seedNumber(seed.id);
   return {
      id: seed.id,
      title: seed.title,
      status: seed.status,
      list: seed.list,
      timeAgo: seed.timeAgo,
      repo: 'lndev-ui',
      prNumber: seed.prNumber,
      targetBranch: 'main',
      sourceBranch: seed.branch,
      additions: seed.files.reduce((acc, file) => acc + file[2], 0),
      deletions: seed.files.reduce((acc, file) => acc + file[3], 0),
      resolves: { identifier: seed.resolves[0], title: seed.resolves[1] },
      checksPassed: seed.status === 'closed' ? 2 : seed.status === 'open' ? 3 : 4,
      checksTotal: 5,
      files: seed.files.map(([name, path, additions, deletions, category]) => ({
         name,
         path,
         additions,
         deletions,
         category,
      })),
      commits: seed.commits.map(([sha, message, timeAgo]) => ({ sha, message, timeAgo })),
      summary: seed.summary,
      testPlan: seed.testPlan.map(([text, checked]) => ({ text, checked })),
      deployment: {
         project: 'lndev-ui-docs',
         state: seed.status === 'closed' ? '已跳过' : '就绪',
         action: '预览',
      },
      reviewNote:
         seed.list === 'for-you' && seed.status === 'merged'
            ? {
                 author: 'Atlas',
                 timeAgo: seed.timeAgo === '1小时前' ? '55分钟前' : seed.timeAgo,
                 ...REVIEW_NOTES[noteSeed % REVIEW_NOTES.length],
              }
            : undefined,
   };
});

export const forYouReviews = reviews.filter((review) => review.list === 'for-you');
export const createdReviews = reviews.filter((review) => review.list === 'created');

export function getReviewById(id: string): Review | undefined {
   return reviews.find((review) => review.id === id);
}
