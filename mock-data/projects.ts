import { Status, status } from './status';
import {
   Accessibility,
   Bell,
   Blocks,
   Bomb,
   BrickWall,
   Cuboid,
   FormInput,
   Globe,
   Grid2X2,
   HelpCircle,
   LayoutDashboard,
   Loader,
   Lock,
   LucideIcon,
   Play,
   Settings,
   Shapes,
   Table,
   TrafficCone,
   Vault,
   Wallpaper,
} from 'lucide-react';
import { RemixiconComponentType } from '@remixicon/react';
import { User, users } from './users';
import { LabelInterface, labels } from './labels';
import { Priority, priorities } from './priorities';
export interface Project {
   id: string;
   name: string;
   status: Status;
   icon: LucideIcon | RemixiconComponentType;
   percentComplete: number;
   startDate: string;
   /** Planned completion date (Linear "Target date"). */
   targetDate?: string;
   lead: User;
   priority: Priority;
   health: Health;
   /** Owning team (see mock-data/teams.ts). */
   teamId: string;
   labels: LabelInterface[];
   initiative?: string;
   /** Days since the last health update (undefined = no update yet). */
   healthUpdatedAgoDays?: number;
}

type BaseProject = Omit<
   Project,
   'targetDate' | 'teamId' | 'labels' | 'initiative' | 'healthUpdatedAgoDays'
>;

export interface Health {
   id: 'no-update' | 'off-track' | 'on-track' | 'at-risk';
   name: string;
   color: string;
   description: string;
}

export const health: Health[] = [
   {
      id: 'no-update',
      name: '暂无更新',
      color: '#8f9299',
      description: '该项目已超过 30 天没有更新。',
   },
   {
      id: 'off-track',
      name: '偏离计划',
      color: '#eb5757',
      description: '项目进度偏离计划，存在延期风险。',
   },
   {
      id: 'on-track',
      name: '按计划进行',
      color: '#4cb782',
      description: '项目按计划进行，进度符合预期。',
   },
   {
      id: 'at-risk',
      name: '存在风险',
      color: '#f2c94c',
      description: '项目存在风险，可能延期交付。',
   },
];

const baseProjects: BaseProject[] = [
   {
      id: '1',
      name: 'LNDev UI - 核心组件',
      status: status[0],
      icon: Cuboid,
      percentComplete: 80,
      startDate: '2025-03-08',
      lead: users[2],
      priority: priorities[1],
      health: health[0],
   },
   {
      id: '2',
      name: 'LNDev UI - 主题',
      status: status[1],
      icon: Blocks,
      percentComplete: 50,
      startDate: '2025-03-14',
      lead: users[0],
      priority: priorities[0],
      health: health[3],
   },
   {
      id: '3',
      name: 'LNDev UI - 弹窗',
      status: status[2],
      icon: Vault,
      percentComplete: 0,
      startDate: '2025-03-09',
      lead: users[1],
      priority: priorities[2],
      health: health[1],
   },
   {
      id: '4',
      name: 'LNDev UI - 导航',
      status: status[3],
      icon: BrickWall,
      percentComplete: 0,
      startDate: '2025-03-10',
      lead: users[2],
      priority: priorities[0],
      health: health[2],
   },
   {
      id: '5',
      name: 'LNDev UI - 布局',
      status: status[4],
      icon: Wallpaper,
      percentComplete: 0,
      startDate: '2025-03-11',
      lead: users[0],
      priority: priorities[0],
      health: health[3],
   },
   {
      id: '6',
      name: 'LNDev UI - 侧边栏',
      status: status[5],
      icon: TrafficCone,
      percentComplete: 0,
      startDate: '2025-03-12',
      lead: users[1],
      priority: priorities[0],
      health: health[1],
   },
   {
      id: '7',
      name: 'LNDev UI - 卡片',
      status: status[1],
      icon: Grid2X2,
      percentComplete: 0,
      startDate: '2025-03-13',
      lead: users[2],
      priority: priorities[0],
      health: health[2],
   },
   {
      id: '8',
      name: 'LNDev UI - 提示气泡',
      status: status[2],
      icon: Bomb,
      percentComplete: 0,
      startDate: '2025-03-14',
      lead: users[0],
      priority: priorities[0],
      health: health[3],
   },
   {
      id: '9',
      name: 'LNDev UI - 下拉菜单',
      status: status[3],
      icon: Shapes,
      percentComplete: 50,
      startDate: '2025-03-15',
      lead: users[1],
      priority: priorities[0],
      health: health[3],
   },
   {
      id: '10',
      name: 'LNDev UI - 数据表格',
      status: status[0],
      icon: Table,
      percentComplete: 65,
      startDate: '2025-03-18',
      lead: users[2],
      priority: priorities[1],
      health: health[0],
   },
   {
      id: '11',
      name: 'LNDev UI - 表单控件',
      status: status[2],
      icon: FormInput,
      percentComplete: 30,
      startDate: '2025-03-19',
      lead: users[0],
      priority: priorities[1],
      health: health[2],
   },
   {
      id: '12',
      name: 'LNDev UI - 通知',
      status: status[1],
      icon: Bell,
      percentComplete: 45,
      startDate: '2025-03-20',
      lead: users[1],
      priority: priorities[0],
      health: health[1],
   },
   {
      id: '13',
      name: 'LNDev UI - 认证流程',
      status: status[0],
      icon: Lock,
      percentComplete: 75,
      startDate: '2025-03-05',
      lead: users[2],
      priority: priorities[0],
      health: health[0],
   },
   {
      id: '14',
      name: 'LNDev UI - 用户偏好',
      status: status[3],
      icon: Settings,
      percentComplete: 10,
      startDate: '2025-03-22',
      lead: users[0],
      priority: priorities[2],
      health: health[2],
   },
   {
      id: '15',
      name: 'LNDev UI - 仪表盘小组件',
      status: status[1],
      icon: LayoutDashboard,
      percentComplete: 55,
      startDate: '2025-03-17',
      lead: users[1],
      priority: priorities[1],
      health: health[0],
   },
   {
      id: '16',
      name: 'LNDev UI - 新手引导',
      status: status[2],
      icon: HelpCircle,
      percentComplete: 25,
      startDate: '2025-03-24',
      lead: users[2],
      priority: priorities[1],
      health: health[3],
   },
   {
      id: '17',
      name: 'LNDev UI - 进度指示器',
      status: status[4],
      icon: Loader,
      percentComplete: 40,
      startDate: '2025-03-16',
      lead: users[0],
      priority: priorities[0],
      health: health[1],
   },
   {
      id: '18',
      name: 'LNDev UI - 国际化',
      status: status[5],
      icon: Globe,
      percentComplete: 15,
      startDate: '2025-03-25',
      lead: users[1],
      priority: priorities[2],
      health: health[2],
   },
   {
      id: '19',
      name: 'LNDev UI - 无障碍功能',
      status: status[0],
      icon: Accessibility,
      percentComplete: 60,
      startDate: '2025-03-21',
      lead: users[2],
      priority: priorities[0],
      health: health[0],
   },
   {
      id: '20',
      name: 'LNDev UI - 媒体播放器',
      status: status[3],
      icon: Play,
      percentComplete: 20,
      startDate: '2025-03-26',
      lead: users[0],
      priority: priorities[1],
      health: health[3],
   },
];

/* -------------------------------------------------------------------------- */
/*            Extended, Linear-style attributes (teams, dates, labels)        */
/* -------------------------------------------------------------------------- */

const TEAM_ROTATION = ['CORE', 'DESIGN', 'PERF', 'WEB', 'API', 'ANALYTICS'];

const INITIATIVES = ['Q3 — 交付组件平台', 'Q3 — 提升质量与无障碍', 'Q4 — 扩大设计系统采用'];

const pad = (value: number) => String(value).padStart(2, '0');

/** Deterministic date helper (no Date.now — SSR safe). */
const isoDate = (year: number, month: number, day: number): string => {
   const normalizedYear = year + Math.floor((month - 1) / 12);
   const normalizedMonth = ((month - 1) % 12) + 1;
   return `${normalizedYear}-${pad(normalizedMonth)}-${pad(Math.min(day, 28))}`;
};

export const projects: Project[] = baseProjects.map((project, index) => {
   // Spread active work around mid-2026 so the timeline view reads well.
   const startMonth = 2 + ((index * 5) % 10); // Feb → Nov 2026
   const startDate = isoDate(2026, startMonth, 1 + ((index * 7) % 26));
   const targetDate = isoDate(2026, startMonth + 2 + (index % 4), 1 + ((index * 11) % 26));

   return {
      ...project,
      startDate,
      targetDate,
      teamId: TEAM_ROTATION[index % TEAM_ROTATION.length],
      labels: [labels[index % labels.length]],
      initiative: INITIATIVES[index % INITIATIVES.length],
      healthUpdatedAgoDays: project.health.id === 'no-update' ? undefined : 1 + (index % 9),
   };
});

export function getProjectById(id: string): Project | undefined {
   return projects.find((project) => project.id === id);
}

export function getProjectsByTeam(teamId: string): Project[] {
   return projects.filter((project) => project.teamId === teamId);
}
