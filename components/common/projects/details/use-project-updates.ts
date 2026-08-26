'use client';

import { useEffect } from 'react';
import { fetchProjectUpdates } from '@/lib/api-projects';
import type { LeanProjectUpdate } from '@/lib/dto';
import { useProjectUpdatesStore } from '@/store/project-updates-store';

/** Projects whose updates have already been requested once (module-level guard). */
const requested = new Set<string>();

/**
 * Returns the real persisted project updates for `projectId`, fetching them
 * from `/api/projects/:id/updates` on first mount and hydrating the shared
 * `useProjectUpdatesStore`. Safe to call from both the Activity tab and the
 * properties side panel (only one fetch per project).
 */
export function useProjectUpdates(projectId: string): LeanProjectUpdate[] {
   const updates = useProjectUpdatesStore((s) => s.updatesByProject[projectId] ?? []);
   const hydrateForProject = useProjectUpdatesStore((s) => s.hydrateForProject);

   useEffect(() => {
      if (requested.has(projectId)) return;
      requested.add(projectId);
      let cancelled = false;
      fetchProjectUpdates(projectId)
         .then((list) => {
            if (!cancelled) hydrateForProject(projectId, list as LeanProjectUpdate[]);
         })
         .catch(() => {});
      return () => {
         cancelled = true;
      };
   }, [projectId, hydrateForProject]);

   return updates;
}
