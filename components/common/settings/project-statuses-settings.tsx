'use client';

import { projects } from '@/mock-data/projects';
import { StatusCategory } from '@/mock-data/status';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { SettingsShell } from './shared';

/**
 * Linear-style project workflow: our project statuses (they reuse the issue
 * workflow in the mock data) are mapped onto the five project categories.
 */
const CATEGORY_GROUPS: { label: string; categories: StatusCategory[] }[] = [
   { label: 'projectStatuses.categories.backlog', categories: ['backlog', 'triage'] },
   { label: 'projectStatuses.categories.planned', categories: ['unstarted'] },
   { label: 'projectStatuses.categories.inProgress', categories: ['started'] },
   { label: 'projectStatuses.categories.completed', categories: ['completed'] },
   { label: 'projectStatuses.categories.canceled', categories: ['canceled'] },
];

/** Workspace "Project statuses" settings. */
export default function ProjectStatusesSettings() {
   const t = useTranslations('settings');
   const groups = useMemo(
      () =>
         CATEGORY_GROUPS.map((group) => {
            const buckets = new Map<
               string,
               { name: string; icon: React.ComponentType; count: number }
            >();
            for (const project of projects) {
               if (!group.categories.includes(project.status.category)) continue;
               const existing = buckets.get(project.status.id);
               if (existing) existing.count += 1;
               else
                  buckets.set(project.status.id, {
                     name: project.status.name,
                     icon: project.status.icon,
                     count: 1,
                  });
            }
            return { ...group, statuses: [...buckets.values()].sort((a, b) => b.count - a.count) };
         }),
      []
   );

   return (
      <SettingsShell
         title={t('projectStatuses.title')}
         description={t('projectStatuses.description')}
      >
         <div className="rounded-lg border bg-container overflow-hidden">
            {groups.map((group) => (
               <div key={group.label}>
                  <div className="flex items-center justify-between px-4 py-2 bg-accent/30 border-y first:border-t-0 border-border/50">
                     <span className="text-sm text-muted-foreground">{t(group.label)}</span>
                     <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="size-3.5" />
                     </button>
                  </div>
                  {group.statuses.length === 0 && (
                     <div className="px-4 py-3 text-xs text-muted-foreground">
                        {t('projectStatuses.noStatuses')}
                     </div>
                  )}
                  {group.statuses.map((status) => (
                     <div key={status.name} className="flex items-center gap-3 px-4 py-3">
                        <span className="inline-flex size-8 items-center justify-center rounded-md bg-muted/50 shrink-0">
                           <status.icon />
                        </span>
                        <div>
                           <div className="text-sm font-medium">{status.name}</div>
                           <div className="text-xs text-muted-foreground">
                              {t('projectStatuses.projectsCount', { count: status.count })}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            ))}
         </div>
      </SettingsShell>
   );
}
