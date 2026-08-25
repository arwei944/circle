'use client';

import { CustomizeSidebarDialog } from '@/components/layout/sidebar/customize-sidebar-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SelectMenu, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';
import { ThemePreferences } from './theme-preferences';

/** Personal "Preferences" settings (general, theme, automations). */
export default function Preferences() {
   const [customizeOpen, setCustomizeOpen] = useState(false);
   const t = useTranslations('settings');
   return (
      <SettingsShell title={t('preferences.title')}>
         <SettingsSection title={t('preferences.general.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('preferences.general.defaultHomeView')}
                  description={t('preferences.general.defaultHomeViewDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('preferences.general.defaultHomeViewOptions.agent'),
                           t('preferences.general.defaultHomeViewOptions.inbox'),
                           t('preferences.general.defaultHomeViewOptions.myIssues'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('preferences.general.displayNames')}
                  description={t('preferences.general.displayNamesDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('preferences.general.displayNamesOptions.username'),
                           t('preferences.general.displayNamesOptions.fullName'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('preferences.general.firstDayOfWeek')}
                  description={t('preferences.general.firstDayOfWeekDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('preferences.general.firstDayOfWeekOptions.monday'),
                           t('preferences.general.firstDayOfWeekOptions.sunday'),
                           t('preferences.general.firstDayOfWeekOptions.saturday'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('preferences.general.emoticons')}
                  description={t('preferences.general.emoticonsDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('preferences.general.sendComments')}
                  description={t('preferences.general.sendCommentsDesc')}
                  trailing={<SelectMenu options={['⌘+Enter', 'Enter']} />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('preferences.interfaceAndTheme.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('preferences.interfaceAndTheme.appSidebar')}
                  description={t('preferences.interfaceAndTheme.appSidebarDesc')}
                  trailing={
                     <Button size="xs" variant="ghost" onClick={() => setCustomizeOpen(true)}>
                        {t('preferences.interfaceAndTheme.customize')}
                     </Button>
                  }
               />
               <SettingsRow
                  title={t('preferences.interfaceAndTheme.fontSize')}
                  description={t('preferences.interfaceAndTheme.fontSizeDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('preferences.interfaceAndTheme.fontSizeOptions.default'),
                           t('preferences.interfaceAndTheme.fontSizeOptions.small'),
                           t('preferences.interfaceAndTheme.fontSizeOptions.large'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('preferences.interfaceAndTheme.pointerCursors')}
                  description={t('preferences.interfaceAndTheme.pointerCursorsDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('preferences.interfaceAndTheme.underlineLinks')}
                  description={t('preferences.interfaceAndTheme.underlineLinksDesc')}
                  trailing={<Switch />}
               />
            </SettingsCard>
            <ThemePreferences />
         </SettingsSection>

         <SettingsSection title={t('preferences.desktopApplication.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('preferences.desktopApplication.openInDesktopApp')}
                  description={t('preferences.desktopApplication.openInDesktopAppDesc')}
                  trailing={<Switch />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('preferences.automations.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('preferences.automations.autoAssignToSelf')}
                  description={t('preferences.automations.autoAssignToSelfDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('preferences.automations.assignOnStarted')}
                  description={t('preferences.automations.assignOnStartedDesc')}
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>
         <CustomizeSidebarDialog open={customizeOpen} onOpenChange={setCustomizeOpen} />
      </SettingsShell>
   );
}
