'use client';

import { useEffect } from 'react';
import { fetchCycles } from '@/lib/api-cycles';
import { useCyclesStore } from '@/store/cycles-store';
import type { LeanCycle } from '@/lib/dto';

export function CyclesDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useCyclesStore((s) => s.hydrated);
   const hydrate = useCyclesStore((s) => s.hydrate);
   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      fetchCycles()
         .then((cycles) => {
            if (!cancelled) hydrate(cycles as LeanCycle[]);
         })
         .catch(() => {});
      return () => {
         cancelled = true;
      };
   }, [hydrated, hydrate]);
   return <>{children}</>;
}
