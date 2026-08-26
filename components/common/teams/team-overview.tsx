'use client';

import ProjectLine from '@/components/common/projects/project-line';
import { toProjectViewModels } from '@/components/common/projects/project-adapter';
import {
   cycleStatusLabel,
   formatCycleDateRange,
   type CycleStatus,
} from '@/components/common/cycles/cycle-utils';
import { fetchTeam } from '@/lib/api-teams';
import type { LeanCycle, LeanProjectAgg } from '@/lib/dto';
import { RiDonutChartFill } from '@remixicon/react';
import { Box, CopyMinus, Layers, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface TeamOverviewData {
   team: { id: string; name: string; icon: string; color: string; joined: boolean } | null;
   projects: LeanProjectAgg[];
   cycles: LeanCycle[];
}

/**
 * Team Home — "Overview" tab: team identity, its projects and cycles,
 * loaded from `/api/teams/{teamId}` via `fetchTeam`. Projects reuse the
 * shared `ProjectLine` row.
 */
export default function TeamOverview() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const t = useTranslations('teams');
   const tc = useTranslations('cycles');

   const [data, setData] = useState<TeamOverviewData | null>(null);

   useEffect(() => {
      let cancelled = false;
      setData(null);
      fetchTeam(teamId)
         .then((overview) => {
            if (!cancelled) setData(overview as TeamOverviewData);
         })
         .catch(() => {
            if (!cancelled) setData(null);
         });
      return () => {
         cancelled = true;
      };
   }, [teamId]);

   const projectViews = useMemo(() => (data ? toProjectViewModels(data.projects) : []), [data]);

   if (data === null) {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10">
            <p className="text-sm text-muted-foreground">{t('overview.loading')}</p>
         </div>
      );
   }

   const team = data.team;

   if (!team) {
      return (
         <div className="w-full max-w-5xl mx-auto px-8 py-10">
            <p className="text-sm text-muted-foreground">{t('overview.notFound')}</p>
         </div>
      );
   }

   const goToLinks = [
      { label: t('overview.goToTeamSettings'), icon: Settings, href: `/${orgId}/settings` },
      { label: t('overview.goToIssues'), icon: CopyMinus, href: `/${orgId}/team/${team.id}/all` },
      {
         label: t('overview.goToCycles'),
         icon: RiDonutChartFill,
         href: `/${orgId}/team/${team.id}/cycles`,
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
                  {team.icon}
               </div>
               <h1 className="text-3xl font-semibold">{team.name}</h1>
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
                  {data.cycles.length === 0 ? (
                     <p className="text-sm text-muted-foreground">{t('overview.noCycles')}</p>
                  ) : (
                     data.cycles.map((cycle) => {
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
