'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { users } from '@/mock-data/users';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Profile" settings. */
export default function Profile() {
   const me = users[0];
   const t = useTranslations('settings');

   return (
      <SettingsShell title={t('profile.title')}>
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title={t('profile.picture')}
                  trailing={
                     <Avatar className="size-9">
                        <AvatarImage src={me.avatarUrl} alt={me.name} />
                        <AvatarFallback>{me.name[0]}</AvatarFallback>
                     </Avatar>
                  }
               />
               <SettingsRow
                  title={t('profile.email')}
                  trailing={
                     <span className="inline-flex items-center gap-2 text-foreground">
                        {me.email}
                        <Button size="icon" variant="ghost" className="size-6">
                           <Pencil className="size-3" />
                        </Button>
                     </span>
                  }
               />
               <SettingsRow
                  title={t('profile.fullName')}
                  trailing={<Input defaultValue="LN" className="h-8 w-44" />}
               />
               <SettingsRow
                  title={t('profile.title')}
                  description={t('profile.titleDescription')}
                  trailing={
                     <Input placeholder={t('profile.titlePlaceholder')} className="h-8 w-44" />
                  }
               />
               <SettingsRow
                  title={t('profile.username')}
                  description={t('profile.usernameDescription')}
                  trailing={<Input defaultValue="ln" className="h-8 w-44" />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('profile.workspaceAccess.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('profile.workspaceAccess.removeSelf')}
                  trailing={
                     <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-500">
                        {t('profile.workspaceAccess.leave')}
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
