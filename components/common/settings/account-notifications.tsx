'use client';

import { Switch } from '@/components/ui/switch';
import { Mail, Monitor, Slack, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EnabledDot, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

const CHANNELS = [
   {
      icon: <Monitor className="size-4" />,
      titleKey: 'notifications.channels.desktop',
      statusKey: 'notifications.channels.status.enabledWithOthers',
      statusCount: 13,
   },
   {
      icon: <Smartphone className="size-4" />,
      titleKey: 'notifications.channels.mobile',
      statusKey: 'notifications.channels.status.enabledWithOthers',
      statusCount: 13,
   },
   {
      icon: <Mail className="size-4" />,
      titleKey: 'notifications.channels.email',
      statusKey: 'notifications.channels.status.all',
   },
   {
      icon: <Slack className="size-4" />,
      titleKey: 'notifications.channels.slack',
      statusKey: 'notifications.channels.status.all',
   },
];

/** Personal notification settings (push channels + product updates). */
export default function AccountNotifications() {
   const t = useTranslations('settings');
   return (
      <SettingsShell title={t('notifications.title')}>
         <SettingsSection
            title={t('notifications.pushNotifications.title')}
            description={t('notifications.pushNotifications.description')}
         >
            <SettingsCard>
               {CHANNELS.map((channel) => (
                  <SettingsRow
                     key={channel.titleKey}
                     icon={channel.icon}
                     title={t(channel.titleKey)}
                     description={
                        <EnabledDot>
                           {channel.statusCount != null
                              ? t(channel.statusKey, { count: channel.statusCount })
                              : t(channel.statusKey)}
                        </EnabledDot>
                     }
                     chevron
                     onClick={() => {}}
                  />
               ))}
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('notifications.updates.title')}
            description={t('notifications.updates.description')}
         >
            <h3 className="text-sm font-medium mt-2">{t('notifications.updates.changelog')}</h3>
            <SettingsCard>
               <SettingsRow
                  title={t('notifications.updates.showInSidebar')}
                  description={t('notifications.updates.showInSidebarDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('notifications.updates.newsletter')}
                  description={t('notifications.updates.newsletterDesc')}
                  trailing={<Switch />}
               />
            </SettingsCard>

            <h3 className="text-sm font-medium mt-2">{t('notifications.updates.marketing')}</h3>
            <SettingsCard>
               <SettingsRow
                  title={t('notifications.updates.marketingOnboarding')}
                  description={t('notifications.updates.marketingOnboardingDesc')}
                  trailing={<Switch />}
               />
            </SettingsCard>

            <h3 className="text-sm font-medium mt-2">{t('notifications.updates.otherUpdates')}</h3>
            <SettingsCard>
               <SettingsRow
                  title={t('notifications.updates.inviteAccepted')}
                  description={t('notifications.updates.inviteAcceptedDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('notifications.updates.privacyLegal')}
                  description={t('notifications.updates.privacyLegalDesc')}
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
