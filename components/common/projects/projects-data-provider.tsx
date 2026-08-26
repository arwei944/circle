'use client';

import { useEffect } from 'react';
import { fetchProjects } from '@/lib/api-projects';
import { useProjectsStore } from '@/store/projects-store';
import type { LeanProjectAgg } from '@/lib/dto';

export function ProjectsDataProvider({ children }: { children?: React.ReactNode }) {
   const hydrated = useProjectsStore((s) => s.hydrated);
   const hydrate = useProjectsStore((s) => s.hydrate);
   useEffect(() => {
      if (hydrated) return;
      let cancelled = false;
      fetchProjects()
         .then((projects) => {
            if (!cancelled) hydrate(projects as LeanProjectAgg[]);
         })
         .catch(() => {});
      return () => {
         cancelled = true;
      };
   }, [hydrated, hydrate]);
   return <>{children}</>;
}
