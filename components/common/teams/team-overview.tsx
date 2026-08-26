'use client';

import ProjectLine from '@/components/common/projects/project-line';
import { toProjectViewModels } from '@/components/common/projects/project-adapter';
import {
   cycleStatusLabel,
   formatCycleDateRange,
   type CycleStatus,
} from '@/components/common/cycles/cycle-utils';
import { ApiError } from '@/lib/api-client';
import { fetchTeam } from '@/lib/api-teams';
import type { LeanCycle } from '@/lib/dto';
import { useProjectsStore } from '@/store/projects-store';
import { RiDonutChartFill } from '@remixicon/react';
import { Box, CopyMinus, Layers, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type OverviewStatus = 'loading' | 'notFound' | 'error' | 'ready';

interface LeanTeamHeader {
   id: string;
   name: string;
   icon: string;
   color: string;
   joined: boolean;
}

/**
 * Team Home — "Overview" tab: team identity + cycles loaded from
 * `/api/teams/{teamId}` via `fetchTeam`, projects derived live from
 * `useProjectsStore` (same source as the Projects page) filtered by team.
 */
export default function TeamOverview() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const t = useTranslations('teams');
   const tc = useTranslations('cycles');

   const [status, setStatus] = useState<OverviewStatus>('loading');
   const [team, setTeam] = useState<LeanTeamHeader | null>(null);
   const [cycles, setCycles] = useState<LeanCycle[]>([]);
   const [reloadKey, setReloadKey] = useState(0);

   useEffect(() => {
      let cancelled = false;
      setStatus('loading');
      setTeam(null);
      setCycles([]);
      fetchTeam(teamId)
         .then((overview) => {
            if (cancelled) return;
            const parsed = overview as unknown as {
               team: LeanTeamHeader | null;
               cycles: LeanCycle[];
            };
            if (!parsed.team) {
               setStatus('notFound');
               return;
            }
            setTeam(parsed.team);
            setCycles(parsed.cycles ?? []);
            setStatus('ready');
         })
         .catch((error: unknown) => {
            if (cancelled) return;
            setStatus(
               error instanceof ApiError && error.code === 'NOT_FOUND' ? 'notFound' : 'error'
            );
         });
      return () => {
         cancelled = true;
      };
   }, [teamId, reloadKey]);

   const storeProjects = useProjectsStore((s) => s.projects);
   const teamProjects = useMemo(
      () => storeProjects.filter((p) => p.teamId === teamId),
      [storeProjects, teamId]
   );
   const projectViews = useMemo(() => toProjectViewModels(teamProjects), [teamProjects]);

   if (status === 'loading') {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10">
            <p className="text-sm text-muted-foreground">{t('overview.loading')}</p>
         </div>
      );
   }

   if (status === 'notFound') {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10">
            <p className="text-sm text-muted-foreground">{t('overview.notFound')}</p>
         </div>
      );
   }

   if (status === 'error') {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10 flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{t('overview.error')}</p>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
               {t('overview.retry')}
            </Button>
         </div>
      );
   }

   // status === 'ready'; team is guaranteed non-null here.
   const readyTeam = team!;

   const goToLinks = [
      { label: t('overview.goToTeamSettings'), icon: Settings, href: `/${orgId}/settings` },
      {
         label: t('overview.goToIssues'),
         icon: CopyMinus,
         href: `/${orgId}/team/${readyTeam.id}/all`,
      },
      {
         label: t('overview.goToCycles'),
         icon: RiDonutChartFill,
         href: `/${orgId}/team/${readyTeam.id}/cycles`,
      },
      { label: t('overview.goToProjects'), icon: Box, href: `/${orgId}/projects` },
      { label: t('overview.goToViews'), icon: Layers, href: '#' },
   ];

   return (
      <div className="w-full max-w-5xl mx-auto px-8 py-10 flex flex-col lg:flex-row gap-12">
         {/* Main column */}
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
               <div className="inline-flex size-12 bg-muted/50 items-center justify-center rounded-lg text-2xl shrink-0">
                  {readyTeam.icon}
               </div>
               <h1 className="text-3xl font-semibold">{readyTeam.name}</h1>
            </div>

            <p className="mt-4 text-muted-foreground">{t('overview.addDescription')}</p>

            {/* Projects */}
            <div className="mt-12">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{t('overview.projects')}</h2>
               </div>

               <div className="mt-4 -mx-6 flex flex-col">
                  {projectViews.length === 0 ? (
                     <p className="text-sm text-muted-foreground px-6">
                        {t('overview.noProjects')}
                     </p>
                  ) : (
                     projectViews.map((project) => (
                        <ProjectLine key={project.id} project={project} />
                     ))
                  )}
               </div>
            </div>

            {/* Cycles */}
            <div className="mt-10">
               <h2 className="text-xl font-semibold">{t('overview.cycles')}</h2>

               <div className="mt-4 flex flex-col">
                  {cycles.length === 0 ? (
                     <p className="text-sm text-muted-foreground">{t('overview.noCycles')}</p>
                  ) : (
                     cycles.map((cycle) => {
                        const statusKey =
                           cycleStatusLabel[cycle.status as CycleStatus] ?? cycle.status;
                        return (
                           <div
                              key={cycle.id}
                              className="flex items-center justify-between gap-3 py-2.5 border-b border-muted-foreground/5 text-sm"
                           >
                              <div className="flex items-center gap-2 min-w-0">
                                 <span
                                    className={
                                       'relative z-10 size-2.5 rounded-full border-2 bg-background ' +
                                       (cycle.status === 'current'
                                          ? 'border-indigo-400 bg-indigo-400'
                                          : 'border-muted-foreground/40')
                                    }
                                 />
                                 <span className="font-medium truncate">{cycle.name}</span>
                                 <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatCycleDateRange(cycle)}
                                 </span>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-md bg-accent text-muted-foreground whitespace-nowrap">
                                 {tc(statusKey)}
                              </span>
                           </div>
                        );
                     })
                  )}
               </div>
            </div>
         </div>

         {/* Side column */}
         <div className="w-full lg:w-60 shrink-0">
            <h3 className="text-sm font-medium text-muted-foreground">{t('overview.goTo')}</h3>
            <div className="mt-2 flex flex-col">
               {goToLinks.map((link) => (
                  <Link
                     key={link.label}
                     href={link.href}
                     className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-md hover:bg-sidebar/50 text-sm"
                  >
                     <link.icon className="size-4 text-muted-foreground" />
                     {link.label}
                  </Link>
               ))}
            </div>
         </div>
      </div>
   );
}
