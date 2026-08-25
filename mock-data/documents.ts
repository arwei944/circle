import { User, users } from './users';

export interface TeamDocument {
   id: string;
   name: string;
   icon: string;
   creator: User;
   createdAt: string; // ISO date
   updatedAt: string; // ISO date
   pinned?: boolean;
}

export interface DocumentFolder {
   id: string;
   name: string;
   icon: string;
   documents: TeamDocument[];
}

/**
 * Team documents grouped by folder (project or theme), Linear-style.
 * All content is fake data for the LNDev UI component library.
 */
export const documentFolders: DocumentFolder[] = [
   {
      id: 'team-documents',
      name: '团队文档',
      icon: '📁',
      documents: [
         {
            id: 'doc-1',
            name: 'LNDev UI 团队日历',
            icon: '📆',
            creator: users[0],
            createdAt: '2026-07-08',
            updatedAt: '2026-07-30',
            pinned: true,
         },
      ],
   },
   {
      id: 'design-tokens-v2',
      name: '设计令牌 v2',
      icon: '🎨',
      documents: [
         {
            id: 'doc-2',
            name: 'PRD - 设计令牌 v2（OKLCH 迁移）',
            icon: '📄',
            creator: users[2],
            createdAt: '2026-06-15',
            updatedAt: '2026-07-22',
         },
         {
            id: 'doc-3',
            name: '规范：令牌命名约定',
            icon: '📐',
            creator: users[4],
            createdAt: '2026-06-18',
            updatedAt: '2026-06-30',
         },
      ],
   },
   {
      id: 'component-playground',
      name: '组件演练场',
      icon: '🧪',
      documents: [
         {
            id: 'doc-4',
            name: 'PRD - 交互式组件演练场',
            icon: '📄',
            creator: users[6],
            createdAt: '2026-06-02',
            updatedAt: '2026-07-12',
         },
         {
            id: 'doc-5',
            name: '通过 URL 共享演练场 — 技术说明',
            icon: '🔗',
            creator: users[8],
            createdAt: '2026-06-10',
            updatedAt: '2026-06-25',
         },
      ],
   },
   {
      id: 'data-table-virtualization',
      name: '数据表格虚拟化',
      icon: '🗂️',
      documents: [
         {
            id: 'doc-6',
            name: 'PRD - 虚拟化数据表格（10k+ 行）',
            icon: '📄',
            creator: users[4],
            createdAt: '2026-07-05',
            updatedAt: '2026-07-28',
         },
      ],
   },
   {
      id: 'accessibility-audit',
      name: '无障碍审计 Q3',
      icon: '♿',
      documents: [
         {
            id: 'doc-7',
            name: 'WCAG 2.2 AA 审计清单',
            icon: '✅',
            creator: users[10],
            createdAt: '2026-06-20',
            updatedAt: '2026-07-18',
         },
         {
            id: 'doc-8',
            name: '焦点管理指南',
            icon: '🎯',
            creator: users[10],
            createdAt: '2026-06-22',
            updatedAt: '2026-07-02',
         },
      ],
   },
   {
      id: 'docs-revamp',
      name: '文档站点改版',
      icon: '📚',
      documents: [
         {
            id: 'doc-9',
            name: 'PRD - 文档搜索与属性表索引',
            icon: '📄',
            creator: users[14],
            createdAt: '2026-05-28',
            updatedAt: '2026-07-10',
         },
         {
            id: 'doc-10',
            name: '组件文档内容风格指南',
            icon: '✍️',
            creator: users[9],
            createdAt: '2026-05-30',
            updatedAt: '2026-06-14',
         },
      ],
   },
   {
      id: 'theming-engine',
      name: '主题引擎',
      icon: '🌗',
      documents: [
         {
            id: 'doc-11',
            name: 'PRD - AI 辅助主题生成器',
            icon: '📄',
            creator: users[7],
            createdAt: '2026-07-09',
            updatedAt: '2026-07-25',
         },
         {
            id: 'doc-12',
            name: '高对比度预设探索',
            icon: '🔆',
            creator: users[12],
            createdAt: '2026-07-11',
            updatedAt: '2026-07-20',
         },
      ],
   },
   {
      id: 'release-process',
      name: '发布流程',
      icon: '🚀',
      documents: [
         {
            id: 'doc-13',
            name: 'v2.4 发布检查清单',
            icon: '📋',
            creator: users[5],
            createdAt: '2026-07-15',
            updatedAt: '2026-07-29',
         },
         {
            id: 'doc-14',
            name: '版本与变更日志约定',
            icon: '🏷️',
            creator: users[16],
            createdAt: '2026-05-12',
            updatedAt: '2026-06-08',
         },
      ],
   },
   {
      id: 'cli-tooling',
      name: 'CLI 与工具链',
      icon: '🛠️',
      documents: [
         {
            id: 'doc-15',
            name: 'PRD - 带测试文件的脚手架 CLI',
            icon: '📄',
            creator: users[8],
            createdAt: '2026-07-01',
            updatedAt: '2026-07-24',
         },
      ],
   },
   {
      id: 'quality',
      name: '质量与测试',
      icon: '🧷',
      documents: [
         {
            id: 'doc-16',
            name: '视觉回归策略（Playwright）',
            icon: '📷',
            creator: users[18],
            createdAt: '2026-05-14',
            updatedAt: '2026-06-27',
         },
      ],
   },
];

export function getAllDocuments(): TeamDocument[] {
   return documentFolders.flatMap((folder) => folder.documents);
}
