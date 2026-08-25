import {
   createIssue as apiCreateIssue,
   deleteIssue as apiDeleteIssue,
   updateIssue as apiUpdateIssue,
} from '@/lib/api-issues';
import { notifyError } from '@/lib/toast';
import { dtoToIssue, type Meta } from '@/lib/frontend-dto';
import { groupIssuesByStatus, type Issue } from '@/mock-data/issues';
import type { LabelInterface } from '@/mock-data/labels';
import type { Priority } from '@/mock-data/priorities';
import type { Project } from '@/mock-data/projects';
import type { Status } from '@/mock-data/status';
import type { User } from '@/mock-data/users';
import type { LeanIssue } from '@/lib/dto';
import { create } from 'zustand';

let currentMeta: Meta = { users: [], projects: [] };
export function setStoreMeta(meta: Meta): void {
   currentMeta = meta;
}

interface FilterOptions {
   status?: string[];
   assignee?: string[];
   priority?: string[];
   labels?: string[];
   project?: string[];
   cycle?: string[];
   statusType?: string[];
}

interface IssuesState {
   // Data
   issues: Issue[];
   issuesByStatus: Record<string, Issue[]>;
   hydrated: boolean;
   hydrate: (issues: Issue[]) => void;

   //
   getAllIssues: () => Issue[];

   // Actions
   addIssue: (issue: Issue) => Promise<void>;
   updateIssue: (id: string, updatedIssue: Partial<Issue>) => Promise<void>;
   deleteIssue: (id: string) => Promise<void>;

   // Filters
   filterByStatus: (statusId: string) => Issue[];
   filterByPriority: (priorityId: string) => Issue[];
   filterByAssignee: (userId: string | null) => Issue[];
   filterByLabel: (labelId: string) => Issue[];
   filterByProject: (projectId: string) => Issue[];
   filterByCycle: (cycleId: string) => Issue[];
   searchIssues: (query: string) => Issue[];
   filterIssues: (filters: FilterOptions) => Issue[];

   // Status management
   updateIssueStatus: (issueId: string, newStatus: Status) => Promise<void>;

   // Priority management
   updateIssuePriority: (issueId: string, newPriority: Priority) => Promise<void>;

   // Assignee management
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => Promise<void>;

   // Labels management
   addIssueLabel: (issueId: string, label: LabelInterface) => Promise<void>;
   removeIssueLabel: (issueId: string, labelId: string) => Promise<void>;

   // Project management
   updateIssueProject: (issueId: string, newProject: Project | undefined) => Promise<void>;

   // Utility functions
   getIssueById: (id: string) => Issue | undefined;
}

const applyIssues = (state: { issues: Issue[] }, next: Issue[]) => ({
   issues: next,
   issuesByStatus: groupIssuesByStatus(next),
});

const toLeanPatch = (updatedIssue: Partial<Issue>): Record<string, unknown> => {
   const patch: Record<string, unknown> = {
      title: updatedIssue.title,
      description: updatedIssue.description,
      statusId: updatedIssue.status?.id,
      priorityId: updatedIssue.priority?.id,
      assigneeId: 'assignee' in updatedIssue ? (updatedIssue.assignee?.id ?? null) : undefined,
      projectId:
         updatedIssue.project === undefined ? undefined : (updatedIssue.project?.id ?? null),
      cycleId: updatedIssue.cycleId,
      dueDate:
         'dueDate' in updatedIssue
            ? updatedIssue.dueDate
               ? new Date(updatedIssue.dueDate).getTime()
               : null
            : undefined,
      labels: updatedIssue.labels?.map((l) => l.id),
   };
   const clean: Record<string, unknown> = {};
   for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) clean[key] = value;
   }
   return clean;
};

export const useIssuesStore = create<IssuesState>((set, get) => ({
   // Initial state
   issues: [],
   issuesByStatus: {},
   hydrated: false,

   //
   getAllIssues: () => get().issues,

   // Actions
   hydrate: (issues) =>
      set(() => ({
         issues,
         issuesByStatus: groupIssuesByStatus(issues),
         hydrated: true,
      })),

   addIssue: async (issue) => {
      const previous = get().issues;
      set((state) => applyIssues(state, [issue, ...state.issues]));
      try {
         const server = await apiCreateIssue({
            title: issue.title,
            description: issue.description,
            statusId: issue.status.id,
            priorityId: issue.priority.id,
            assigneeId: issue.assignee?.id ?? null,
            projectId: issue.project?.id ?? null,
            cycleId: issue.cycleId || '',
            dueDate: issue.dueDate ? Date.parse(issue.dueDate) : null,
            labels: issue.labels.map((l) => l.id),
         });
         const hasStatusObj = 'status' in (server as object);
         const enriched: Issue = hasStatusObj
            ? (server as Issue)
            : dtoToIssue(server as LeanIssue, currentMeta);
         set((state) =>
            applyIssues(
               state,
               state.issues.map((i) => (i.id === issue.id ? enriched : i))
            )
         );
      } catch (e) {
         set((state) => applyIssues(state, previous));
         notifyError((e as Error).message);
      }
   },

   updateIssue: async (id, updatedIssue) => {
      const previous = get().issues;
      set((state) =>
         applyIssues(
            state,
            state.issues.map((i) => (i.id === id ? { ...i, ...updatedIssue } : i))
         )
      );
      try {
         await apiUpdateIssue(id, toLeanPatch(updatedIssue));
      } catch (e) {
         set((state) => applyIssues(state, previous));
         notifyError((e as Error).message);
      }
   },

   deleteIssue: async (id) => {
      const previous = get().issues;
      set((state) =>
         applyIssues(
            state,
            state.issues.filter((issue) => issue.id !== id)
         )
      );
      try {
         await apiDeleteIssue(id);
      } catch (e) {
         set((state) => applyIssues(state, previous));
         notifyError((e as Error).message);
      }
   },

   // Filters
   filterByStatus: (statusId: string) => {
      return get().issues.filter((issue) => issue.status.id === statusId);
   },

   filterByPriority: (priorityId: string) => {
      return get().issues.filter((issue) => issue.priority.id === priorityId);
   },

   filterByAssignee: (userId: string | null) => {
      if (userId === null) {
         return get().issues.filter((issue) => issue.assignee === null);
      }
      return get().issues.filter((issue) => issue.assignee?.id === userId);
   },

   filterByLabel: (labelId: string) => {
      return get().issues.filter((issue) => issue.labels.some((label) => label.id === labelId));
   },

   filterByProject: (projectId: string) => {
      return get().issues.filter((issue) => issue.project?.id === projectId);
   },

   filterByCycle: (cycleId: string) => {
      return get().issues.filter((issue) => issue.cycleId === cycleId);
   },

   searchIssues: (query: string) => {
      const lowerCaseQuery = query.toLowerCase();
      return get().issues.filter(
         (issue) =>
            issue.title.toLowerCase().includes(lowerCaseQuery) ||
            issue.identifier.toLowerCase().includes(lowerCaseQuery)
      );
   },

   filterIssues: (filters: FilterOptions) => {
      let filteredIssues = get().issues;

      // Filter by status
      if (filters.status && filters.status.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.status!.includes(issue.status.id)
         );
      }

      // Filter by assignee
      if (filters.assignee && filters.assignee.length > 0) {
         filteredIssues = filteredIssues.filter((issue) => {
            if (filters.assignee!.includes('unassigned')) {
               // If 'unassigned' is selected and the issue has no assignee
               if (issue.assignee === null) {
                  return true;
               }
            }
            // Check if the issue's assignee is in the selected assignees
            return issue.assignee && filters.assignee!.includes(issue.assignee.id);
         });
      }

      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.priority!.includes(issue.priority.id)
         );
      }

      // Filter by labels
      if (filters.labels && filters.labels.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            issue.labels.some((label) => filters.labels!.includes(label.id))
         );
      }

      // Filter by project
      if (filters.project && filters.project.length > 0) {
         filteredIssues = filteredIssues.filter(
            (issue) => issue.project && filters.project!.includes(issue.project.id)
         );
      }

      // Filter by cycle ('no-cycle' matches issues outside any cycle)
      if (filters.cycle && filters.cycle.length > 0) {
         filteredIssues = filteredIssues.filter((issue) => {
            if (filters.cycle!.includes('no-cycle') && issue.cycleId === '') {
               return true;
            }
            return filters.cycle!.includes(issue.cycleId);
         });
      }

      // Filter by status type (status category)
      if (filters.statusType && filters.statusType.length > 0) {
         filteredIssues = filteredIssues.filter((issue) =>
            filters.statusType!.includes(issue.status.category)
         );
      }

      return filteredIssues;
   },

   // Status management
   updateIssueStatus: (issueId: string, newStatus: Status) => {
      return get().updateIssue(issueId, { status: newStatus });
   },

   // Priority management
   updateIssuePriority: (issueId: string, newPriority: Priority) => {
      return get().updateIssue(issueId, { priority: newPriority });
   },

   // Assignee management
   updateIssueAssignee: (issueId: string, newAssignee: User | null) => {
      return get().updateIssue(issueId, { assignee: newAssignee });
   },

   // Labels management
   addIssueLabel: async (issueId, label) => {
      const issue = get().getIssueById(issueId);
      if (!issue) return;
      const updatedLabels = [...issue.labels, label];
      await get().updateIssue(issueId, { labels: updatedLabels });
   },

   removeIssueLabel: async (issueId, labelId) => {
      const issue = get().getIssueById(issueId);
      if (!issue) return;
      const updatedLabels = issue.labels.filter((label) => label.id !== labelId);
      await get().updateIssue(issueId, { labels: updatedLabels });
   },

   // Project management
   updateIssueProject: (issueId: string, newProject: Project | undefined) => {
      return get().updateIssue(issueId, { project: newProject });
   },

   // Utility functions
   getIssueById: (id: string) => {
      return get().issues.find((issue) => issue.id === id);
   },
}));
