'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { INTEGRATION_LOGOS } from './integration-logos';
import { EnabledDot, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

const SlackLogo = INTEGRATION_LOGOS['slack'];
const GoogleCalendarLogo = INTEGRATION_LOGOS['google-calendar'];
const NotionLogo = INTEGRATION_LOGOS['notion'];
const GithubLogo = INTEGRATION_LOGOS['github'];

function ConnectedTrailing() {
   const t = useTranslations('settings');
   return (
      <span className="inline-flex items-center gap-1.5 text-sm">
         <EnabledDot>
            <span className="text-foreground">{t('common.connected')}</span>
         </EnabledDot>
         <ChevronDown className="size-3.5 text-muted-foreground" />
      </span>
   );
}

/** Personal "Connected accounts" settings. */
export default function AccountConnections() {
   const t = useTranslations('settings');
   return (
      <SettingsShell
         title={t('connectedAccounts.title')}
         description={t('connectedAccounts.description')}
      >
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  icon={<SlackLogo className="size-4" />}
                  title="Slack"
                  description={t('connectedAccounts.slackDescription')}
                  trailing={<ConnectedTrailing />}
               />
            </SettingsCard>
            <SettingsCard>
               <SettingsRow
                  icon={<GoogleCalendarLogo className="size-4" />}
                  title="Google Calendar"
                  description={t('connectedAccounts.googleCalendarDescription')}
                  trailing={<ConnectedTrailing />}
               />
            </SettingsCard>
            <SettingsCard>
               <SettingsRow
                  icon={<NotionLogo className="size-4" />}
                  title="Notion"
                  description={t('connectedAccounts.notionDescription')}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('common.connect')}
                        <ArrowUpRight className="size-3.5" />
                     </Button>
                  }
               />
            </SettingsCard>
            <SettingsCard>
               <SettingsRow
                  icon={<GithubLogo className="size-4" />}
                  title={
                     <>
                        GitHub
                        <span className="text-xs text-muted-foreground font-normal">
                           · @ln-dev7
                        </span>
                     </>
                  }
               />
               <SettingsRow
                  title="octo-relay"
                  description={t('connectedAccounts.octoRelayDescription')}
                  trailing={<ConnectedTrailing />}
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
