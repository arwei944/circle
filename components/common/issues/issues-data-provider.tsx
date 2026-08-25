'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchIssues, fetchMeta } from '@/lib/api-issues';
import { dtoToIssue, type Meta } from '@/lib/frontend-dto';
import { useIssuesStore, setStoreMeta } from '@/store/issues-store';
import type { LeanIssue } from '@/lib/dto';

export function IssuesDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useIssuesStore((s) => s.hydrated);
   const hydrate = useIssuesStore((s) => s.hydrate);
   const t = useTranslations('issues');
   const [failed, setFailed] = useState(false);

   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      (async () => {
         try {
            const [issues, meta] = await Promise.all([fetchIssues(), fetchMeta()]);
            if (cancelled) return;
            const m = meta as unknown as Meta;
            setStoreMeta(m);
            hydrate(issues.map((d) => dtoToIssue(d as LeanIssue, m)));
         } catch {
            if (!cancelled) setFailed(true);
         }
      })();
      return () => {
         cancelled = true;
      };
   }, [hydrated, hydrate]);

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
