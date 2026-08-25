'use client';

import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Invented workspace issue templates. */
const TEMPLATES = [
   { name: 'Bug report intake', meta: 'Created by sophia.reed 1 year ago' },
   { name: 'Component feature request', meta: 'Created by mason.carter 1 year ago' },
   { name: 'Release checklist', meta: 'Updated by alex.zhang 2 years ago' },
];

/** Workspace "Issue templates" settings. */
export default function IssueTemplatesSettings() {
   const t = useTranslations('settings');
   return (
      <SettingsShell
         title={t('issueTemplates.title')}
         description={t('issueTemplates.description')}
      >
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title={t('issueTemplates.count', { count: TEMPLATES.length })}
                  trailing={
                     <Button size="icon" variant="ghost" className="size-7">
                        <Plus className="size-4" />
                     </Button>
                  }
               />
               {TEMPLATES.map((template) => (
                  <SettingsRow
                     key={template.name}
                     icon={<FileText className="size-4" />}
                     title={template.name}
                     description={template.meta}
                     onClick={() => {}}
                  />
               ))}
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
