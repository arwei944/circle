import type { LeanProjectUpdate } from '@/lib/dto';
import type { Issue } from '@/mock-data/issues';

export const PROJECT_UPDATE_HEALTH_COLORS: Record<string, string> = {
   'on-track': '#4cb782',
   'at-risk': '#f2c94c',
   'off-track': '#eb5757',
   'no-update': '#8f9299',
};

export const PROJECT_UPDATE_HEALTH_IDS = ['on-track', 'at-risk', 'off-track', 'no-update'] as const;

export interface ProjectActivityItem {
   id: string;
   kind: 'update' | 'issue-created';
   date: number;
   health?: string;
   message?: string;
   issueTitle?: string;
   issueIdentifier?: string;
}

/**
 * Builds a blended activity feed (newest first) from a project's persisted
 * updates and its issues' creation events. Used by the properties side panel
 * compact feed; the Activity tab renders the two groups separately.
 */
export function buildProjectActivity(
   issues: Issue[],
   updates: LeanProjectUpdate[]
): ProjectActivityItem[] {
   const issueItems: ProjectActivityItem[] = issues.map((issue) => ({
      id: `issue-${issue.id}`,
      kind: 'issue-created',
      date: Date.parse(issue.createdAt) || 0,
      issueTitle: issue.title,
      issueIdentifier: issue.identifier,
   }));
   const updateItems: ProjectActivityItem[] = updates.map((update) => ({
      id: `update-${update.id}`,
      kind: 'update',
      date: update.createdAt,
      health: update.health,
      message: update.message,
   }));
   return [...updateItems, ...issueItems].sort((a, b) => b.date - a.date);
}
