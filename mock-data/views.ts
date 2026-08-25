import { Issue, issues } from './issues';
import { Project, projects } from './projects';
import { StatusCategory } from './status';
import { User, users } from './users';

export type ViewType = 'issue' | 'project';

/** Declarative filter of a saved view, applied by getViewIssues/getViewProjects. */
export interface ViewFilter {
   statusCategories?: StatusCategory[];
   statusIds?: string[];
   labelIds?: string[];
   priorityIds?: string[];
   /** Only issues that belong to a project. */
   hasProject?: boolean;
   /** Only issues assigned to nobody. */
   unassigned?: boolean;
}

export interface View {
   id: string;
   name: string;
   description: string;
   /** Emoji shown as the view icon. */
   icon: string;
   type: ViewType;
   /** Owning team; undefined = workspace-level view. */
   teamId?: string;
   owner: User;
   createdAt: string;
   updatedAt: string;
   filter: ViewFilter;
}

/** Saved views of the workspace (Views page). Fake data, LNDev UI storyline. */
export const views: View[] = [
   /* --------------------------------- issues -------------------------------- */
   {
      id: 'blocked-3-days',
      teamId: 'CORE',
      name: '阻塞超 3 天的问题',
      description: '处于已阻塞或已暂停状态超过 3 天的问题',
      icon: '🧊',
      type: 'issue',
      owner: users[0],
      createdAt: '2026-03-04',
      updatedAt: '2026-07-21',
      filter: { statusIds: ['blocked', 'paused'] },
   },
   {
      id: 'in-progress-recent',
      teamId: 'CORE',
      name: '进行中已满 1 天',
      description: '最近一天内开始且当前处于进行中的问题',
      icon: '⏱️',
      type: 'issue',
      owner: users[0],
      createdAt: '2026-03-04',
      updatedAt: '2026-07-30',
      filter: { statusIds: ['in-progress'] },
   },
   {
      id: 'stale-reviews',
      teamId: 'DESIGN',
      name: '评审停滞超 3 天的问题',
      description: '处于评审状态且超过 3 天未更新的问题',
      icon: '⌛',
      type: 'issue',
      owner: users[2],
      createdAt: '2026-03-19',
      updatedAt: '2026-07-12',
      filter: { statusIds: ['technical-review'] },
   },
   {
      id: 'discuss-backlog-review',
      teamId: 'DESIGN',
      name: '待讨论 — 待办评审',
      description: '待办评审中产品与工程团队需要提出来讨论的话题',
      icon: '💬',
      type: 'issue',
      owner: users[3],
      createdAt: '2026-04-02',
      updatedAt: '2026-07-28',
      filter: { statusIds: ['idea', 'triage'] },
   },
   {
      id: 'ready-for-sprint',
      teamId: 'WEB',
      name: '为下个迭代准备就绪',
      description: '已完成梳理、随时可以拉入周期的问题',
      icon: '⚡',
      type: 'issue',
      owner: users[5],
      createdAt: '2026-04-15',
      updatedAt: '2026-08-01',
      filter: { statusIds: ['to-do'], priorityIds: ['urgent', 'high', 'medium'] },
   },
   {
      id: 'qa-handoff',
      teamId: 'WEB',
      name: 'QA 交付',
      description: '工程团队提交的待验收测试工单',
      icon: '🧪',
      type: 'issue',
      owner: users[2],
      createdAt: '2026-04-22',
      updatedAt: '2026-07-25',
      filter: { statusIds: ['technical-review', 'product-feedback'] },
   },
   {
      id: 'active-bugs',
      teamId: 'CORE',
      name: '活跃缺陷',
      description: '标记为缺陷标签的活跃问题',
      icon: '🐞',
      type: 'issue',
      owner: users[0],
      createdAt: '2026-02-11',
      updatedAt: '2026-08-02',
      filter: { labelIds: ['bug'], statusCategories: ['unstarted', 'started', 'triage'] },
   },
   {
      id: 'active-cycle-issues',
      teamId: 'AI',
      name: '活跃周期问题',
      description: '特定团队活跃周期内的问题',
      icon: '🔄',
      type: 'issue',
      owner: users[4],
      createdAt: '2026-05-02',
      updatedAt: '2026-07-31',
      filter: { statusCategories: ['started'] },
   },
   {
      id: 'unassigned-active',
      teamId: 'AI',
      name: '无负责人的活跃问题',
      description: '活跃周期内未分配给具体用户的问题',
      icon: '🫥',
      type: 'issue',
      owner: users[6],
      createdAt: '2026-05-20',
      updatedAt: '2026-07-18',
      filter: { statusCategories: ['unstarted', 'started'], unassigned: true },
   },
   {
      id: 'manual-bug-reports',
      name: '手动缺陷报告',
      description: '标记为缺陷标签且由团队手动报告的问题',
      icon: '📝',
      type: 'issue',
      owner: users[1],
      createdAt: '2026-06-03',
      updatedAt: '2026-07-29',
      filter: { labelIds: ['bug'] },
   },
   {
      id: 'security-review',
      name: '安全评审队列',
      description: '标记为安全标签、待安全加固评审的问题',
      icon: '🔐',
      type: 'issue',
      owner: users[8],
      createdAt: '2026-06-10',
      updatedAt: '2026-07-22',
      filter: { labelIds: ['security'] },
   },
   {
      id: 'completed-issues',
      name: '已完成问题',
      description: '工作区内所有已发布或已完成的问题',
      icon: '🏆',
      type: 'issue',
      owner: users[0],
      createdAt: '2026-01-30',
      updatedAt: '2026-08-03',
      filter: { statusCategories: ['completed'] },
   },
   /* -------------------------------- projects ------------------------------- */
   {
      id: 'decision-record-roadmap',
      name: '(DR) 决策记录路线图',
      description: '领导团队可访问的项目',
      icon: '🗂️',
      type: 'project',
      owner: users[1],
      createdAt: '2026-03-08',
      updatedAt: '2026-07-15',
      filter: { priorityIds: ['urgent', 'high'] },
   },
   {
      id: 'all-active-projects',
      name: '全部项目',
      description: '当前进行中的项目',
      icon: '📦',
      type: 'project',
      owner: users[0],
      createdAt: '2026-02-14',
      updatedAt: '2026-08-01',
      filter: { statusCategories: ['started'] },
   },
   {
      id: 'roadmap-core',
      teamId: 'CORE',
      name: '路线图 — 核心组件',
      description: 'LNDev Core 团队可访问的项目',
      icon: '🛠️',
      type: 'project',
      owner: users[2],
      createdAt: '2026-03-22',
      updatedAt: '2026-07-27',
      filter: {},
   },
   {
      id: 'roadmap-design',
      teamId: 'DESIGN',
      name: '路线图 — 设计系统',
      description: '设计系统团队中处于待办状态的、可访问的项目',
      icon: '🎨',
      type: 'project',
      owner: users[3],
      createdAt: '2026-04-05',
      updatedAt: '2026-07-19',
      filter: { statusCategories: ['backlog'] },
   },
   {
      id: 'roadmap-performance',
      teamId: 'PERF',
      name: '路线图 — 性能实验室',
      description: '目标日期介于 2026 年 7 月至 10 月之间的项目',
      icon: '☀️',
      type: 'project',
      owner: users[4],
      createdAt: '2026-04-18',
      updatedAt: '2026-07-24',
      filter: {},
   },
   {
      id: 'roadmap-web',
      teamId: 'WEB',
      name: '路线图 — Web 平台',
      description: 'Web 开发团队可访问的项目',
      icon: '🌐',
      type: 'project',
      owner: users[5],
      createdAt: '2026-05-09',
      updatedAt: '2026-07-30',
      filter: {},
   },
   {
      id: 'roadmap-mobile',
      teamId: 'MOBILE',
      name: '路线图 — 移动端 (WIP)',
      description: '移动团队可访问的项目',
      icon: '📱',
      type: 'project',
      owner: users[6],
      createdAt: '2026-06-12',
      updatedAt: '2026-08-02',
      filter: { statusCategories: ['unstarted', 'backlog'] },
   },
];

export const issueViews = views.filter((view) => view.type === 'issue');
export const projectViews = views.filter((view) => view.type === 'project');

export function getViewsByTeam(teamId: string): View[] {
   return views.filter((view) => view.teamId === teamId);
}

export function getViewById(id: string): View | undefined {
   return views.find((view) => view.id === id);
}

/** Apply an issue view's declarative filter to the issue list. */
export function filterIssuesForView(view: View, source: Issue[] = issues): Issue[] {
   const { filter } = view;
   return source.filter((issue) => {
      if (filter.statusCategories && !filter.statusCategories.includes(issue.status.category)) {
         return false;
      }
      if (filter.statusIds && !filter.statusIds.includes(issue.status.id)) return false;
      if (filter.labelIds && !issue.labels.some((label) => filter.labelIds?.includes(label.id))) {
         return false;
      }
      if (filter.priorityIds && !filter.priorityIds.includes(issue.priority.id)) return false;
      if (filter.hasProject && !issue.project) return false;
      if (filter.unassigned && issue.assignee) return false;
      return true;
   });
}

/** Apply a project view's declarative filter to the project list. */
export function filterProjectsForView(view: View, source: Project[] = projects): Project[] {
   const { filter } = view;
   return source.filter((project) => {
      if (filter.statusCategories && !filter.statusCategories.includes(project.status.category)) {
         return false;
      }
      if (filter.priorityIds && !filter.priorityIds.includes(project.priority.id)) return false;
      return true;
   });
}
