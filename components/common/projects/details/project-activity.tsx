'use client';

import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getProjectDetail } from '@/mock-data/project-details';
import { useIssuesStore } from '@/store/issues-store';
import { useProjectsStore } from '@/store/projects-store';
import { useProjectUpdatesStore } from '@/store/project-updates-store';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Paperclip, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LeanProjectUpdate } from '@/lib/dto';
import { toProjectViewModel } from '../project-adapter';
import { useProjectUpdates } from './use-project-updates';
import { PROJECT_UPDATE_HEALTH_COLORS, PROJECT_UPDATE_HEALTH_IDS } from './project-activity-data';
import { ProjectSidePanel } from './project-side-panel';

interface ProjectActivityProps {
   projectId: string;
}

function HealthBadge({ health }: { health: string }) {
   const t = useTranslations('projects');
   const color = PROJECT_UPDATE_HEALTH_COLORS[health] ?? '#8f9299';
   const label = PROJECT_UPDATE_HEALTH_IDS.includes(
      health as (typeof PROJECT_UPDATE_HEALTH_IDS)[number]
   )
      ? t(`activity.health.${health}`)
      : health;
   return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-2 py-0.5">
         <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
         {label}
      </span>
   );
}

function UpdateCard({ update, onDelete }: { update: LeanProjectUpdate; onDelete: () => void }) {
   const t = useTranslations('projects');
   return (
      <div className="border rounded-lg p-4">
         <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">
               {format(new Date(update.createdAt), 'MMM d, yyyy')}
            </span>
            <span className="ml-auto">
               <HealthBadge health={update.health} />
            </span>
            <Button
               variant="ghost"
               size="icon"
               className="size-6 text-muted-foreground hover:text-destructive"
               onClick={onDelete}
               aria-label={t('activity.deleteUpdate')}
            >
               <Trash2 className="size-3.5" />
            </Button>
         </div>
         <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{update.message}</p>
      </div>
   );
}

/** Project "Activity" tab: update composer + real persisted update timeline. */
export default function ProjectActivity({ projectId }: ProjectActivityProps) {
   const t = useTranslations('projects');
   const lean = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
   const detail = getProjectDetail(projectId);
   const updates = useProjectUpdates(projectId);
   const create = useProjectUpdatesStore((s) => s.create);
   const removeUpdate = useProjectUpdatesStore((s) => s.remove);
   const { issues: allIssues } = useIssuesStore();
   const issues = useMemo(
      () => allIssues.filter((issue) => issue.project?.id === projectId),
      [allIssues, projectId]
   );

   const [health, setHealth] = useState<string>('on-track');
   const [text, setText] = useState('');

   const createdIssues = useMemo(
      () => issues.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      [issues]
   );

   const updatesByMonth = useMemo(() => {
      const groups = new Map<string, LeanProjectUpdate[]>();
      for (const update of updates) {
         const month = format(new Date(update.createdAt), 'MMMM yyyy');
         groups.set(month, [...(groups.get(month) ?? []), update]);
      }
      return [...groups.entries()];
   }, [updates]);

   const completedPercent =
      issues.length > 0
         ? Math.round(
              (issues.filter((issue) => issue.status.category === 'completed').length /
                 issues.length) *
                 100
           )
         : 0;

   if (!lean) return null;
   const project = toProjectViewModel(lean);

   const handlePost = () => {
      if (text.trim() === '') return;
      void create(project.id, { message: text.trim(), health });
      setText('');
   };

   return (
      <div className="w-full h-full flex overflow-hidden">
         <div className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 lg:px-10 py-8">
               {/* Composer */}
               <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                     <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none">
                           <HealthBadge health={health} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                           {PROJECT_UPDATE_HEALTH_IDS.map((value) => (
                              <DropdownMenuItem key={value} onClick={() => setHealth(value)}>
                                 <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: PROJECT_UPDATE_HEALTH_COLORS[value] }}
                                 />
                                 {t(`activity.health.${value}`)}
                              </DropdownMenuItem>
                           ))}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>

                  <textarea
                     value={text}
                     onChange={(event) => setText(event.target.value)}
                     placeholder={t('activity.updatePlaceholder')}
                     className="mt-3 w-full min-h-24 resize-y bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />

                  <div className="mt-1 border-l-2 pl-4 py-1 flex flex-col gap-1.5 text-xs text-muted-foreground">
                     <div className="flex gap-6">
                        <span className="w-20">{t('activity.priority')}</span>
                        <span>
                           {t('activity.noPriorityPrefix')}{' '}
                           <span className="text-foreground">{project.priority.name}</span>
                        </span>
                     </div>
                     <div className="flex gap-6">
                        <span className="w-20">{t('activity.lead')}</span>
                        <span>
                           <span className="text-foreground">{project.lead.name}</span>{' '}
                           {t('activity.assigned')}
                        </span>
                     </div>
                     <div className="flex gap-6">
                        <span className="w-20">{t('activity.targetDate')}</span>
                        <span>
                           {t('activity.setTo')}{' '}
                           <span className="text-foreground">
                              {project.targetDate
                                 ? format(new Date(`${project.targetDate}T00:00:00`), 'MMM do')
                                 : '—'}
                           </span>
                        </span>
                     </div>
                     <div className="flex gap-6">
                        <span className="w-20">{t('activity.progress')}</span>
                        <span>
                           {t('activity.progressPrefix')}{' '}
                           <span className="text-foreground">{completedPercent}%</span>
                        </span>
                     </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                     <Button variant="outline" size="xs" className="gap-1.5">
                        <Sparkles className="size-3.5" />
                        {t('activity.writeWithAgent')}
                     </Button>
                     <div className="flex items-center gap-2">
                        <Button
                           variant="ghost"
                           size="icon"
                           className="size-7 text-muted-foreground"
                        >
                           <Paperclip className="size-4" />
                        </Button>
                        <Button size="xs" onClick={handlePost} disabled={text.trim() === ''}>
                           {t('activity.postUpdate')}
                        </Button>
                     </div>
                  </div>
               </div>

               {/* Timeline */}
               {updatesByMonth.length === 0 ? (
                  <p className="mt-10 text-sm text-muted-foreground text-center">
                     {t('activity.empty')}
                  </p>
               ) : (
                  updatesByMonth.map(([month, monthUpdates]) => (
                     <div key={month} className="mt-8">
                        <h3 className="text-lg font-semibold mb-3">{month}</h3>
                        <div className="flex flex-col gap-3">
                           {monthUpdates.map((update) => (
                              <UpdateCard
                                 key={update.id}
                                 update={update}
                                 onDelete={() => void removeUpdate(project.id, update.id)}
                              />
                           ))}
                        </div>
                     </div>
                  ))
               )}

               {/* Recently created issues */}
               <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">{t('activity.createdIssues')}</h3>
                  {createdIssues.length === 0 ? (
                     <p className="text-sm text-muted-foreground">
                        {t('activity.noCreatedIssues')}
                     </p>
                  ) : (
                     <div className="flex flex-col">
                        {createdIssues.map((issue, index) => (
                           <div
                              key={issue.id}
                              className={cn(
                                 'flex items-center gap-2 py-1.5 text-sm',
                                 index > 0 && 'border-t border-border/30'
                              )}
                           >
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                 {format(new Date(issue.createdAt), 'MMM d')}
                              </span>
                              <span className="truncate">
                                 {t('activity.issueCreated', { title: issue.title })}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                 {issue.identifier}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         <ProjectSidePanel project={project} detail={detail} issues={issues} />
      </div>
   );
}
