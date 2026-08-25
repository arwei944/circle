import { Priority, priorities } from './priorities';
import { Health, health, Project, projects } from './projects';
import { User, users } from './users';

export type InitiativeStatus = 'active' | 'planned' | 'completed';

export interface Initiative {
   id: string;
   name: string;
   description?: string;
   /** Emoji used as the initiative icon. */
   icon: string;
   status: InitiativeStatus;
   priority: Priority;
   owner?: User;
   /** Target label shown in the list ("Q3 2026", "Sep 30th", …). */
   target?: string;
   health: Health;
   projectIds: string[];
   createdAt: string;
}

export const INITIATIVE_STATUS_META: Record<InitiativeStatus, { label: string; color: string }> = {
   active: { label: '进行中', color: '#f2c94c' },
   planned: { label: '计划中', color: '#95a2b3' },
   completed: { label: '已完成', color: '#5e6ad2' },
};

const noUpdate = health[0];
const byId = (id: string): Health => health.find((entry) => entry.id === id) ?? noUpdate;

/**
 * Workspace initiatives (Linear "Initiatives" page). Fake data around the
 * LNDev UI component-library storyline; projects reference mock-data/projects.
 */
export const initiatives: Initiative[] = [
   {
      id: 'component-platform',
      name: 'Q3 — 交付组件平台',
      description: '交付完整核心组件套件，并提供稳定的 API 与文档。',
      icon: '🧱',
      status: 'active',
      priority: priorities[0],
      owner: users[0],
      target: 'Q3 2026',
      health: byId('on-track'),
      projectIds: ['1', '2', '3', '7', '13', '19'],
      createdAt: '2026-04-02',
   },
   {
      id: 'quality-accessibility',
      name: 'Q3 — 提升质量与无障碍',
      description: '全库通过 WCAG AA 无障碍标准，并覆盖视觉回归测试与审计。',
      icon: '♿',
      status: 'active',
      priority: priorities[2],
      owner: users[3],
      target: 'Q3 2026',
      health: byId('at-risk'),
      projectIds: ['4', '10', '16', '22'],
      createdAt: '2026-04-11',
   },
   {
      id: 'design-system-adoption',
      name: 'Q4 — 扩大设计系统采用',
      description: '通过模板、起步套件与集成推动设计系统采用。',
      icon: '🌱',
      status: 'active',
      priority: priorities[3],
      owner: users[1],
      target: 'Q4 2026',
      health: noUpdate,
      projectIds: ['5', '11', '17', '23'],
      createdAt: '2026-05-06',
   },
   {
      id: 'performance-lab',
      name: 'Q3 — 将包体积减半',
      description: '可摇树优化的导出、按需加载的原子组件与更精简的运行时。',
      icon: '⚡',
      status: 'active',
      priority: priorities[1],
      owner: users[4],
      target: 'Q3 2026',
      health: byId('on-track'),
      projectIds: ['6', '12', '18'],
      createdAt: '2026-04-20',
   },
   {
      id: 'docs-refresh',
      name: 'Q3 — 文档更新',
      icon: '📚',
      status: 'active',
      priority: priorities[0],
      owner: users[6],
      target: 'Q3 2026',
      health: noUpdate,
      projectIds: ['8', '14'],
      createdAt: '2026-05-14',
   },
   {
      id: 'theming-engine',
      name: 'Q4 — 下一代主题引擎',
      description: '设计令牌、运行时主题变体与可视化主题构建器。',
      icon: '🎨',
      status: 'planned',
      priority: priorities[2],
      owner: users[2],
      target: 'Q4 2026',
      health: noUpdate,
      projectIds: ['2', '9', '15'],
      createdAt: '2026-06-01',
   },
   {
      id: 'mobile-primitives',
      name: 'Q4 — 移动端优先的原子组件',
      description: '针对小屏优化的触控目标、手势与自适应布局。',
      icon: '📱',
      status: 'planned',
      priority: priorities[0],
      owner: users[5],
      target: 'Q4 2026',
      health: noUpdate,
      projectIds: ['20', '24'],
      createdAt: '2026-06-09',
   },
   {
      id: 'playground',
      name: 'Q4 — 交互式组件演练场',
      icon: '🛝',
      status: 'planned',
      priority: priorities[4],
      owner: users[7],
      target: '9 月 30 日',
      health: noUpdate,
      projectIds: ['21', '25'],
      createdAt: '2026-06-18',
   },
   {
      id: 'backlog-grooming',
      name: '待办 — 社区请求',
      icon: '🧺',
      status: 'planned',
      priority: priorities[0],
      target: 'Q4 2026',
      health: noUpdate,
      projectIds: ['9', '24'],
      createdAt: '2026-06-25',
   },
   {
      id: 'v2-launch',
      name: 'Q2 — 发布 LNDev UI v2',
      description: '品牌焕新、新官网与 v2 破坏性变更迁移指南。',
      icon: '🚀',
      status: 'completed',
      priority: priorities[1],
      owner: users[0],
      target: 'Q2 2026',
      health: byId('on-track'),
      projectIds: ['1', '5', '8'],
      createdAt: '2026-01-12',
   },
   {
      id: 'infra-migration',
      name: 'Q2 — 将 CI 迁移到自托管运行器',
      icon: '🏗️',
      status: 'completed',
      priority: priorities[3],
      owner: users[8],
      target: 'Q2 2026',
      health: byId('on-track'),
      projectIds: ['12'],
      createdAt: '2026-02-03',
   },
];

export function getInitiativeById(id: string): Initiative | undefined {
   return initiatives.find((initiative) => initiative.id === id);
}

export function getInitiativeProjects(initiative: Initiative): Project[] {
   return initiative.projectIds
      .map((id) => projects.find((project) => project.id === id))
      .filter((project): project is Project => Boolean(project));
}

/** Projects considered "completed" for the n / m counter. */
export function countCompletedProjects(initiative: Initiative): number {
   return getInitiativeProjects(initiative).filter(
      (project) => project.status.category === 'completed' || project.percentComplete >= 100
   ).length;
}
