'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal settings for the workspace agent. */
export default function AgentPersonalization() {
   const t = useTranslations('settings');
   return (
      <SettingsShell
         title={t('agentPersonalization.title')}
         description={t('agentPersonalization.description')}
      >
         <SettingsSection
            title={t('agentPersonalization.guidance.title')}
            description={t('agentPersonalization.guidance.description')}
         >
            <textarea
               placeholder={t('agentPersonalization.guidance.placeholder')}
               className="w-full min-h-36 rounded-lg border bg-container p-4 text-sm outline-none resize-y placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            />
         </SettingsSection>

         <SettingsSection
            title={t('agentPersonalization.skills.title')}
            description={t('agentPersonalization.skills.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('agentPersonalization.skills.none')}
                  trailing={
                     <Button size="icon" variant="ghost" className="size-7">
                        <Plus className="size-4" />
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('agentPersonalization.mcp.title')}
            description={t('agentPersonalization.mcp.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('agentPersonalization.mcp.disabled')}
                  muted
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('agentPersonalization.mcp.configure')}
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
