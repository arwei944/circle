'use client';

import { CapacityRing } from '@/components/common/cycles/capacity-ring';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Issue } from '@/mock-data/issues';
import { getCycleById } from '@/mock-data/cycles';
import { ProjectDetail } from '@/mock-data/project-details';
import { Project } from '@/mock-data/projects';
import { teams } from '@/mock-data/teams';
import { PanelFilterTarget, usePanelFilter } from '@/components/common/issues/use-panel-filter';
import { cn } from '@/lib/utils';
import { useProjectsStore } from '@/store/projects-store';
import { format, parseISO } from 'date-fns';
import { ProjectProgressChart } from './project-progress-chart';
import { ArrowRight, Check, Compass, Plus, Slack, Tag, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { DatePicker } from '../date-picker';
import { LabelSelector } from '../label-selector';
import { LeadSelector } from '../lead-selector';
import { PrioritySelector } from '../priority-selector';
import { StatusWithPercent } from '../status-with-percent';
import { PROJECT_UPDATE_HEALTH_COLORS } from './project-activity-data';
import { buildProjectActivity } from './project-activity-data';
import { useProjectUpdates } from './use-project-updates';

interface ProjectPropertiesPanelProps {
   project: Project;
   detail: ProjectDetail;
   issues: Issue[];
}

const isCompleted = (issue: Issue) => issue.status.category === 'completed';

const formatDay = (iso?: string) => (iso ? format(parseISO(iso), 'MMM do') : '—');

const isoOf = (date?: Date): string | null => (date ? date.toISOString().slice(0, 10) : null);

interface BreakdownRow {
   key: string;
   label: string;
   leading: React.ReactNode;
   total: number;
   completedPercent: number;
   /** Click-to-filter target (exclusive, like the insights panel rows). */
   target?: PanelFilterTarget;
}

function buildRows<T>(
   issues: Issue[],
   keyOf: (issue: Issue) => T | undefined,
   describe: (key: T, sample: Issue) => Omit<BreakdownRow, 'total' | 'completedPercent'>
): BreakdownRow[] {
   const buckets = new Map<T, Issue[]>();
   for (const issue of issues) {
      const key = keyOf(issue);
      if (key === undefined) continue;
      buckets.set(key, [...(buckets.get(key) ?? []), issue]);
   }
   return [...buckets.entries()]
      .map(([key, bucket]) => ({
         ...describe(key, bucket[0]),
         total: bucket.length,
         completedPercent: Math.round((bucket.filter(isCompleted).length / bucket.length) * 100),
      }))
      .sort((a, b) => b.total - a.total);
}

function BreakdownList({
   rows,
   panelFilter,
}: {
   rows: BreakdownRow[];
   panelFilter: ReturnType<typeof usePanelFilter>;
}) {
   const t = useTranslations('projects');
   if (rows.length === 0) {
      return <p className="text-xs text-muted-foreground px-1 py-3">{t('empty.nothingToShow')}</p>;
   }
   return (
      <div className="flex flex-col">
         {rows.map((row) => {
            const active = row.target ? panelFilter.isActive(row.target) : false;
            return (
               <button
                  key={row.key}
                  type="button"
                  onClick={() => row.target && panelFilter.toggle(row.target)}
                  className={cn(
                     'flex items-center justify-between gap-3 py-2 px-1.5 -mx-1.5 rounded-md text-left transition-colors',
                     row.target && 'cursor-pointer hover:bg-accent/50',
                     active && 'bg-accent hover:bg-accent'
                  )}
               >
                  <div className="flex items-center gap-2 min-w-0">
                     {row.leading}
                     <span className="text-sm truncate">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground">
                     <CapacityRing value={row.completedPercent} color="#6771c5" />
                     <span className="whitespace-nowrap">
                        {t('properties.percentOf', {
                           percent: row.completedPercent,
                           total: row.total,
                        })}
                     </span>
                  </div>
               </button>
            );
         })}
      </div>
   );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
   return (
      <div className="flex items-center justify-between gap-4 min-h-7">
         <span className="text-sm text-muted-foreground shrink-0">{label}</span>
         <div className="flex items-center gap-1.5 text-sm min-w-0">{children}</div>
      </div>
   );
}

/**
 * Right-side panel of the project pages: properties (editable via
 * `updateProject`), milestones, progress breakdowns and a compact activity
 * feed built from real updates + issue-creation events.
 */
export function ProjectPropertiesPanel({ project, detail, issues }: ProjectPropertiesPanelProps) {
   const t = useTranslations('projects');
   const { orgId } = useParams<{ orgId: string }>();
   const panelFilter = usePanelFilter();
   const updateProject = useProjectsStore((s) => s.updateProject);
   const updates = useProjectUpdates(project.id);
   const completed = issues.filter(isCompleted).length;

   const team = teams.find((candidate) => candidate.id === project.teamId);

   const started = issues.filter((issue) => issue.status.category === 'started').length;

   const members = useMemo(() => {
      const seen = new Set<string>();
      return issues
         .map((issue) => issue.assignee)
         .filter((assignee): assignee is NonNullable<typeof assignee> => {
            if (!assignee || seen.has(assignee.id)) return false;
            seen.add(assignee.id);
            return true;
         });
   }, [issues]);

   const activity = useMemo(() => buildProjectActivity(issues, updates), [issues, updates]);

   const assigneeRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => issue.assignee?.id ?? 'no-assignee',
            (key, sample) =>
               sample.assignee
                  ? {
                       key: String(key),
                       label: sample.assignee.name,
                       leading: (
                          <Avatar className="size-5 shrink-0">
                             <AvatarImage
                                src={sample.assignee.avatarUrl}
                                alt={sample.assignee.name}
                             />
                             <AvatarFallback>{sample.assignee.name[0]}</AvatarFallback>
                          </Avatar>
                       ),
                       target: { columnId: 'assignee', value: sample.assignee.id },
                    }
                  : {
                       key: 'no-assignee',
                       label: t('properties.noAssignee'),
                       leading: null,
                       target: { columnId: 'assignee', value: 'unassigned' },
                    }
         ),
      [issues, t]
   );

   const labelRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => issue.labels[0]?.id,
            (key, sample) => ({
               key: String(key),
               label: sample.labels[0]?.name ?? t('properties.unlabeled'),
               leading: (
                  <span
                     className="size-2.5 rounded-full shrink-0"
                     style={{ backgroundColor: sample.labels[0]?.color ?? 'gray' }}
                  />
               ),
               target: { columnId: 'labels', value: String(key) },
            })
         ),
      [issues, t]
   );

   const cycleRows = useMemo(
      () =>
         buildRows(
            issues,
            (issue) => (issue.cycleId === '' ? undefined : issue.cycleId),
            (key) => ({
               key: String(key),
               label: getCycleById(String(key))?.name ?? t('properties.cycle', { id: String(key) }),
               leading: null,
               target: { columnId: 'cycle', value: String(key) },
            })
         ),
      [issues, t]
   );

   return (
      <div className="flex flex-col h-full w-full overflow-y-auto">
         {/* Properties */}
         <div className="px-5 pt-4 pb-4 border-b">
            <h3 className="text-sm font-medium mb-2.5">{t('properties.title')}</h3>
            <div className="flex flex-col gap-1">
               <PropertyRow label={t('properties.status')}>
                  <StatusWithPercent
                     status={project.status}
                     percentComplete={project.percentComplete}
                     onStatusChange={(statusId) => void updateProject(project.id, { statusId })}
                  />
               </PropertyRow>
               <PropertyRow label={t('properties.priority')}>
                  <PrioritySelector
                     priority={project.priority}
                     onPriorityChange={(priorityId) =>
                        void updateProject(project.id, { priority: priorityId })
                     }
                  />
               </PropertyRow>
               <PropertyRow label={t('properties.lead')}>
                  <LeadSelector
                     lead={project.lead}
                     onLeadChange={(userId) => void updateProject(project.id, { leadId: userId })}
                  />
               </PropertyRow>
               <PropertyRow label={t('properties.members')}>
                  {members.length > 0 ? (
                     <span className="inline-flex items-center gap-1.5">
                        <span className="flex -space-x-1.5">
                           {members.slice(0, 3).map((member) => (
                              <Avatar key={member.id} className="size-5 border-2 border-container">
                                 <AvatarImage src={member.avatarUrl} alt={member.name} />
                                 <AvatarFallback>{member.name[0]}</AvatarFallback>
                              </Avatar>
                           ))}
                        </span>
                        {t('properties.memberCount', { count: members.length })}
                     </span>
                  ) : (
                     <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <UserPlus className="size-3.5" />
                        {t('properties.addMembers')}
                     </button>
                  )}
               </PropertyRow>
               <PropertyRow label={t('properties.dates')}>
                  <DatePicker
                     key={`start-${project.startDate ?? ''}`}
                     date={
                        project.startDate ? new Date(`${project.startDate}T00:00:00`) : undefined
                     }
                     onDateChange={(d) => void updateProject(project.id, { startDate: isoOf(d) })}
                  />
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <DatePicker
                     key={`target-${project.targetDate ?? ''}`}
                     date={
                        project.targetDate ? new Date(`${project.targetDate}T00:00:00`) : undefined
                     }
                     onDateChange={(d) => void updateProject(project.id, { targetDate: isoOf(d) })}
                  />
               </PropertyRow>
               <PropertyRow label={t('properties.teams')}>
                  <span className="inline-flex items-center gap-1.5">
                     {team?.icon} {team?.name ?? project.teamId}
                  </span>
               </PropertyRow>
               <PropertyRow label={t('properties.slack')}>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                     <Slack className="size-3.5" />
                     {t('properties.connectChannel')}
                  </button>
               </PropertyRow>
               <PropertyRow label={t('properties.initiatives')}>
                  {project.initiative ? (
                     <span className="truncate max-w-44">{project.initiative}</span>
                  ) : (
                     <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Compass className="size-3.5" />
                        {t('properties.noInitiative')}
                     </span>
                  )}
               </PropertyRow>
               <PropertyRow label={t('properties.labels')}>
                  <div className="flex items-center gap-1.5">
                     {project.labels.length === 0 && (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                           <Tag className="size-3.5" />
                           {t('properties.addLabel')}
                        </span>
                     )}
                     {project.labels.map((label) => (
                        <span
                           key={label.id}
                           className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5"
                        >
                           <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: label.color }}
                           />
                           {label.name}
                        </span>
                     ))}
                     <LabelSelector
                        selected={project.labels}
                        onLabelsChange={(next) =>
                           void updateProject(project.id, { labels: next.map((l) => l.id) })
                        }
                     />
                  </div>
               </PropertyRow>
            </div>
         </div>

         {/* Milestones */}
         <div className="px-5 py-4 border-b">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium">{t('milestones.title')}</h3>
               <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="size-3.5" />
               </button>
            </div>
            {detail.milestones.length === 0 ? (
               <p className="text-xs text-muted-foreground">
                  {t('milestones.empty')}{' '}
                  <span className="text-foreground/70 underline">{t('milestones.learnMore')}</span>
               </p>
            ) : (
               <div className="flex flex-col gap-1.5">
                  {detail.milestones.map((milestone) => (
                     <div
                        key={milestone.id}
                        className="flex items-center justify-between gap-2 text-sm"
                     >
                        <span className="flex items-center gap-2 min-w-0">
                           <span
                              className={
                                 milestone.completed
                                    ? 'size-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0'
                                    : 'size-4 rounded-full border border-muted-foreground/40 shrink-0'
                              }
                           >
                              {milestone.completed && <Check className="size-2.5 text-white" />}
                           </span>
                           <span
                              className={
                                 milestone.completed
                                    ? 'truncate line-through text-muted-foreground'
                                    : 'truncate'
                              }
                           >
                              {milestone.name}
                           </span>
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                           {formatDay(milestone.targetDate)}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Progress */}
         <div className="px-5 py-4 border-b">
            <h3 className="text-sm font-medium mb-3">{t('progress.title')}</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#8f9299]" />
                     {t('progress.scope')}
                  </div>
                  <span className="text-sm font-medium">{issues.length}</span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#facc15]" />
                     {t('progress.started')}
                  </div>
                  <span className="text-sm font-medium">{started}</span>
               </div>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <span className="size-2 rounded-[2px] bg-[#6771c5]" />
                     {t('progress.completed')}
                  </div>
                  <span className="text-sm font-medium">{completed}</span>
               </div>
            </div>
            <div className="mb-3">
               <ProjectProgressChart
                  startDate={project.startDate}
                  endDate={project.targetDate ?? project.startDate}
                  scope={issues.length}
                  started={started}
                  completed={completed}
               />
            </div>
            <Tabs defaultValue="assignees">
               <TabsList className="h-8 bg-transparent gap-1 p-0">
                  <TabsTrigger value="assignees" className="text-xs px-2.5 rounded-full">
                     {t('properties.tabs.assignees')}
                  </TabsTrigger>
                  <TabsTrigger value="labels" className="text-xs px-2.5 rounded-full">
                     {t('properties.tabs.labels')}
                  </TabsTrigger>
                  <TabsTrigger value="cycles" className="text-xs px-2.5 rounded-full">
                     {t('properties.tabs.cycles')}
                  </TabsTrigger>
               </TabsList>
               <TabsContent value="assignees">
                  <BreakdownList rows={assigneeRows} panelFilter={panelFilter} />
               </TabsContent>
               <TabsContent value="labels">
                  <BreakdownList rows={labelRows} panelFilter={panelFilter} />
               </TabsContent>
               <TabsContent value="cycles">
                  <BreakdownList rows={cycleRows} panelFilter={panelFilter} />
               </TabsContent>
            </Tabs>
         </div>

         {/* Activity */}
         <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium">{t('properties.activity')}</h3>
               <Link
                  href={`/${orgId}/project/${project.id}/activity`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
               >
                  {t('properties.seeAll')}
               </Link>
            </div>
            {activity.length === 0 ? (
               <p className="text-xs text-muted-foreground">{t('activity.empty')}</p>
            ) : (
               <div className="flex flex-col gap-3">
                  {activity.slice(0, 6).map((item) => (
                     <div key={item.id} className="flex items-start gap-2 text-xs">
                        <span
                           className="size-2 mt-1 rounded-full shrink-0"
                           style={{
                              backgroundColor:
                                 item.kind === 'update'
                                    ? (PROJECT_UPDATE_HEALTH_COLORS[item.health ?? ''] ?? '#8f9299')
                                    : '#6771c5',
                           }}
                        />
                        <p className="min-w-0 text-muted-foreground leading-relaxed">
                           {item.kind === 'update' ? (
                              <span className="line-clamp-2 block">{item.message}</span>
                           ) : (
                              t('activity.issueCreated', { title: item.issueTitle ?? '' })
                           )}
                           <span className="ml-1 whitespace-nowrap opacity-70">
                              {format(new Date(item.date), 'MMM d')}
                           </span>
                        </p>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
