'use client';

import { Button } from '@/components/ui/button';
import { KeyRound, Laptop, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Security & access" settings (sessions, passkeys, API keys). */
export default function AccountSecurity() {
   const t = useTranslations('settings');
   return (
      <SettingsShell title={t('security.title')}>
         <SettingsSection
            title={t('security.sessions.title')}
            description={t('security.sessions.description')}
         >
            <SettingsCard>
               <SettingsRow
                  icon={<Laptop className="size-4" />}
                  title={t('security.sessions.currentDevice')}
                  description={
                     <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#00cc66]" />
                        <span className="text-[#00a05a]">
                           {t('security.sessions.currentSession')}
                        </span>{' '}
                        · Paris, FR · (EN, FR)
                     </span>
                  }
               />
            </SettingsCard>
            <SettingsCard>
               <SettingsRow
                  title={t('security.sessions.otherSessions', { count: 1 })}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('security.sessions.revokeAll')}
                     </Button>
                  }
               />
               <SettingsRow
                  icon={<Smartphone className="size-4" />}
                  title={t('security.sessions.iosDevice')}
                  description={t('security.sessions.lastSeen')}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('security.passkeys.title')}
            description={t('security.passkeys.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('security.passkeys.none')}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('security.passkeys.new')}
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('security.apiKeys.title')}
            description={t('security.apiKeys.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('security.apiKeys.count', { count: 1 })}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('security.apiKeys.new')}
                     </Button>
                  }
               />
               <SettingsRow
                  icon={<KeyRound className="size-4" />}
                  title={
                     <>
                        LNDEV_PERSONAL_API_KEY
                        <span className="text-xs text-muted-foreground font-normal">
                           {t('security.apiKeys.accessDetails')}
                        </span>
                     </>
                  }
                  description={t('security.apiKeys.createdInfo')}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('security.signingKey.title')}
            description={t('security.signingKey.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('security.signingKey.none')}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('security.signingKey.addKey')}
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
