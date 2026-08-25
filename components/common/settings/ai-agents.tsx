'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RiSlackFill } from '@remixicon/react';
import { Bot, MessageCircleQuestion, Radar, RefreshCcw, Sparkles, Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

const AGENT_FEATURES = [
   {
      icon: <Bot className="size-4" />,
      titleKey: 'ai.agentSection.features.agent',
      descriptionKey: 'ai.agentSection.features.agentDesc',
   },
   {
      icon: <Terminal className="size-4" />,
      titleKey: 'ai.agentSection.features.codingSessions',
      descriptionKey: 'ai.agentSection.features.codingSessionsDesc',
   },
   {
      icon: <RefreshCcw className="size-4" />,
      titleKey: 'ai.agentSection.features.loops',
      descriptionKey: 'ai.agentSection.features.loopsDesc',
   },
   {
      icon: <Sparkles className="size-4" />,
      titleKey: 'ai.agentSection.features.codeIntelligence',
      descriptionKey: 'ai.agentSection.features.codeIntelligenceDesc',
      beta: true,
   },
   {
      icon: <Radar className="size-4" />,
      titleKey: 'ai.agentSection.features.triageIntelligence',
      descriptionKey: 'ai.agentSection.features.triageIntelligenceDesc',
   },
];

/** Workspace "AI & Agents" settings. */
export default function AiAgents() {
   const t = useTranslations('settings');
   return (
      <SettingsShell title={t('ai.title')} description={t('ai.description')}>
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title={t('ai.usageFeedback')}
                  description={t('ai.usageFeedbackDesc')}
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('ai.agentSection.title')}
            description={t('ai.agentSection.description')}
         >
            <SettingsCard>
               {AGENT_FEATURES.map((feature) => (
                  <SettingsRow
                     key={feature.titleKey}
                     icon={feature.icon}
                     title={
                        <>
                           {t(feature.titleKey)}
                           {feature.beta && (
                              <span className="text-[10px] font-medium uppercase tracking-wide border rounded px-1 py-px text-muted-foreground">
                                 {t('ai.beta')}
                              </span>
                           )}
                        </>
                     }
                     description={t(feature.descriptionKey)}
                     trailing={<span>{t('common.enabled')}</span>}
                     chevron
                     onClick={() => {}}
                  />
               ))}
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('ai.integrations.title')}
            description={t('ai.integrations.description')}
            action={
               <Button size="xs" variant="secondary">
                  {t('ai.integrations.browse')}
               </Button>
            }
         >
            <SettingsCard>
               <SettingsRow
                  icon={<RiSlackFill className="size-4" />}
                  title="Slack"
                  description={t('ai.integrations.slackDescription')}
                  trailing={<span>{t('common.enabled')}</span>}
                  chevron
                  onClick={() => {}}
               />
               <SettingsRow
                  icon={<MessageCircleQuestion className="size-4" />}
                  title="Asks for Slack"
                  description={t('ai.integrations.asksForSlackDescription')}
                  trailing={<span>{t('common.enabled')}</span>}
                  chevron
                  onClick={() => {}}
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
