'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchProjects } from '@/lib/api-projects';
import { useProjectsStore } from '@/store/projects-store';
import type { LeanProjectAgg } from '@/lib/dto';

/** Backoff before the single in-mount retry after a fetch failure. */
const RETRY_DELAY_MS = 1500;

export function ProjectsDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useProjectsStore((s) => s.hydrated);
   const hydrate = useProjectsStore((s) => s.hydrate);
   const t = useTranslations('issues');
   const [failed, setFailed] = useState(false);
   const [attempt, setAttempt] = useState(0);

   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      (async () => {
         try {
            const projects = await fetchProjects();
            if (cancelled) return;
            hydrate(projects as LeanProjectAgg[]);
         } catch {
            if (cancelled) return;
            // Keep the store unhydrated so a later remount re-runs this; retry
            // once on a backoff before surfacing the failure banner.
            if (attempt === 0) {
               retryTimer = setTimeout(() => setAttempt((n) => n + 1), RETRY_DELAY_MS);
            } else {
               setFailed(true);
            }
         }
      })();
      return () => {
         cancelled = true;
         if (retryTimer) clearTimeout(retryTimer);
      };
   }, [hydrated, hydrate, attempt]);

   if (failed) {
      return (
         <>
            <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-destructive bg-red-50 dark:bg-red-950/40">
               {t('dataLoadError')}
            </div>
            {children}
         </>
      );
   }
   return <>{children}</>;
}
