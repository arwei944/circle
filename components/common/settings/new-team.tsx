'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teams } from '@/mock-data/teams';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** "Join or create a team" settings page. */
export default function NewTeam() {
   const notJoined = teams.filter((team) => !team.joined);
   const t = useTranslations('settings');

   return (
      <SettingsShell title={t('teams.joinTitle')} description={t('teams.joinDescription')}>
         <SettingsSection title={t('teams.create.title')}>
            <SettingsCard>
               <div className="flex items-center gap-3 p-4">
                  <Input placeholder={t('teams.create.namePlaceholder')} className="h-8 flex-1" />
                  <Button size="xs">{t('teams.create.createButton')}</Button>
               </div>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('teams.join.title')}>
            <SettingsCard>
               {notJoined.map((team) => (
                  <SettingsRow
                     key={team.id}
                     icon={<span className="text-sm">{team.icon}</span>}
                     title={team.name}
                     description={t('teams.membersAndProjects', {
                        members: team.members.length,
                        projects: team.projects.length,
                     })}
                     trailing={
                        <Button size="xs" variant="secondary">
                           <Check className="size-3.5" />
                           {t('teams.join.button')}
                        </Button>
                     }
                  />
               ))}
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
