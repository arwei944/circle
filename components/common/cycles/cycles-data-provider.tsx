'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchCycles } from '@/lib/api-cycles';
import { useCyclesStore } from '@/store/cycles-store';
import type { LeanCycle } from '@/lib/dto';

/** Backoff before the single in-mount retry after a fetch failure. */
const RETRY_DELAY_MS = 1500;

export function CyclesDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useCyclesStore((s) => s.hydrated);
   const hydrate = useCyclesStore((s) => s.hydrate);
   const t = useTranslations('issues');
   const [failed, setFailed] = useState(false);
   const [attempt, setAttempt] = useState(0);

   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      (async () => {
         try {
            const cycles = await fetchCycles();
            if (cancelled) return;
            hydrate(cycles as LeanCycle[]);
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
