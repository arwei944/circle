export interface LeanUser {
   id: string;
   name: string;
   email: string;
   avatarUrl: string;
   timezone: string;
   status: string;
   role: string;
   joinedDate: string;
   teamIds: string[];
}

export interface LeanProject {
   id: string;
   name: string;
   iconIndex: number;
   color: string;
   teamId: string;
   startDate?: string | null;
   targetDate?: string | null;
   percentComplete: number;
}

export interface LeanLabel {
   id: string;
   name: string;
   color: string;
}

export interface LeanIssue {
   id: string;
   identifier: string;
   title: string;
   description: string;
   statusId: string;
   priorityId: string;
   assigneeId: string | null;
   projectId: string | null;
   cycleId: string;
   createdAt: string;
   dueDate?: string | null;
   rank: string;
   subissues: string[];
   labels: LeanLabel[];
   assignee?: LeanUser | null;
   project?: LeanProject | null;
}

export const toDateString = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
