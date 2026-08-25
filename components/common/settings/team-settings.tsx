'use client';

import { Button } from '@/components/ui/button';
import { getCyclesByTeam } from '@/mock-data/cycles';
import { status } from '@/mock-data/status';
import { teams } from '@/mock-data/teams';
import {
   Bot,
   ChevronRight,
   FileText,
   Lock,
   Radar,
   RefreshCcw,
   Repeat,
   Settings,
   Sparkles,
   Tag,
   Target,
   Users,
   Workflow,
   Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection } from './shared';

interface TeamSettingsProps {
   teamId: string;
}

/** Per-team settings page (general, workflow, AI and danger zone). */
export default function TeamSettings({ teamId }: TeamSettingsProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const team = teams.find((candidate) => candidate.id === teamId);
   const t = useTranslations('settings');

   if (!team) {
      return (
         <div className="max-w-2xl mx-auto px-6 py-10">
            <h1 className="text-2xl font-medium">{t('teams.notFound')}</h1>
         </div>
      );
   }

   const cycles = getCyclesByTeam(team.id);

   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
            <div className="flex items-center gap-3">
               <span className="inline-flex size-9 bg-muted/50 items-center justify-center rounded-md text-lg">
                  {team.icon}
               </span>
               <div className="flex-1">
                  <h1 className="text-2xl font-medium">{team.name}</h1>
                  <p className="text-sm text-muted-foreground">{t('teams.accessibleToAll')}</p>
               </div>
               <Link
                  href={`/${orgId}/team/${team.id}/overview`}
                  className="text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
               >
                  {t('teams.overview')}
                  <ChevronRight className="size-4" />
               </Link>
            </div>

            <div className="flex flex-col gap-10 mt-10">
               <SettingsSection>
                  <SettingsCard>
                     <SettingsRow
                        icon={<Settings className="size-4" />}
                        title={t('teams.general.title')}
                        description={t('teams.general.description')}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Lock className="size-4" />}
                        title={t('teams.access.title')}
                        description={t('teams.access.description')}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Users className="size-4" />}
                        title={t('teams.members.title')}
                        description={t('teams.members.description')}
                        trailing={
                           <span>{t('teams.members.count', { count: team.members.length })}</span>
                        }
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Zap className="size-4" />}
                        title={t('teams.slackNotifications.title')}
                        description={t('teams.slackNotifications.description')}
                        trailing={<span>{t('common.off')}</span>}
                        chevron
                        onClick={() => {}}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title={t('teams.issuesProjectsDocs.title')}>
                  <SettingsCard>
                     <SettingsRow
                        icon={<Tag className="size-4" />}
                        title={t('teams.issueLabels.title')}
                        description={t('teams.issueLabels.description')}
                        trailing={<span>{t('teams.issueLabels.count', { count: 7 })}</span>}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<FileText className="size-4" />}
                        title={t('teams.templates.title')}
                        description={t('teams.templates.description')}
                        trailing={<span>{t('teams.templates.count', { count: 3 })}</span>}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Repeat className="size-4" />}
                        title={t('teams.recurringIssues.title')}
                        description={t('teams.recurringIssues.description')}
                        trailing={<span>{t('common.none')}</span>}
                        chevron
                        onClick={() => {}}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title={t('teams.workflow.title')}>
                  <SettingsCard>
                     <SettingsRow
                        icon={<Target className="size-4" />}
                        title={t('teams.issueStatuses.title')}
                        description={t('teams.issueStatuses.description')}
                        trailing={
                           <span>{t('teams.issueStatuses.count', { count: status.length })}</span>
                        }
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Workflow className="size-4" />}
                        title={t('teams.workflows.title')}
                        description={t('teams.workflows.description')}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Radar className="size-4" />}
                        title={t('teams.triage.title')}
                        description={t('teams.triage.description')}
                        trailing={<span>{t('common.enabled')}</span>}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<RefreshCcw className="size-4" />}
                        title={t('teams.cycles.title')}
                        description={t('teams.cycles.description')}
                        trailing={
                           <span>
                              {cycles.length > 0
                                 ? t('teams.cycles.everyTwoWeeks')
                                 : t('common.off')}
                           </span>
                        }
                        chevron
                        onClick={() => {}}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title={t('teams.ai.title')}>
                  <SettingsCard>
                     <SettingsRow
                        icon={<Bot className="size-4" />}
                        title={t('teams.ai.teamAgents')}
                        description={t('teams.ai.teamAgentsDesc')}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Sparkles className="size-4" />}
                        title={t('teams.ai.agentSkills')}
                        description={t('teams.ai.agentSkillsDesc')}
                        trailing={<span>{t('common.none')}</span>}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<RefreshCcw className="size-4" />}
                        title={t('teams.ai.loops')}
                        description={t('teams.ai.loopsDesc')}
                        trailing={<span>{t('common.none')}</span>}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<Zap className="size-4" />}
                        title={t('teams.ai.projectUpdates')}
                        description={t('teams.ai.projectUpdatesDesc')}
                        chevron
                        onClick={() => {}}
                     />
                     <SettingsRow
                        icon={<FileText className="size-4" />}
                        title={t('teams.ai.threadSummaries')}
                        description={t('teams.ai.threadSummariesDesc')}
                        chevron
                        onClick={() => {}}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection
                  title={t('teams.hierarchy.title')}
                  description={t('teams.hierarchy.description')}
               >
                  <div />
               </SettingsSection>

               <SettingsSection title={t('teams.dangerZone.title')}>
                  <SettingsCard>
                     <SettingsRow
                        title={t('teams.dangerZone.leave.title')}
                        description={t('teams.dangerZone.leave.description')}
                        trailing={
                           <Button size="xs" variant="ghost">
                              {t('teams.dangerZone.leave.button')}
                           </Button>
                        }
                     />
                     <SettingsRow
                        title={t('teams.dangerZone.retire.title')}
                        description={t('teams.dangerZone.retire.description')}
                        muted
                        trailing={
                           <Button size="xs" variant="ghost">
                              {t('teams.dangerZone.retire.button')}
                           </Button>
                        }
                     />
                     <SettingsRow
                        title={t('teams.dangerZone.delete.title')}
                        description={t('teams.dangerZone.delete.description')}
                        muted
                        trailing={
                           <Button size="xs" variant="ghost">
                              {t('teams.dangerZone.delete.button')}
                           </Button>
                        }
                     />
                  </SettingsCard>
               </SettingsSection>
            </div>
         </div>
      </div>
   );
}
