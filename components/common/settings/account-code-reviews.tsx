'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SelectMenu, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Fake diff shown in the "Code theme" preview (invented snippet). */
const DIFF_LINES: { number?: string; text: string; kind: 'context' | 'removed' | 'added' }[] = [
   { number: '1', text: 'const config = {', kind: 'context' },
   { number: '2', text: '  apiUrl: "https://api.example.com",', kind: 'context' },
   { number: '3', text: '  timeout: 5000,', kind: 'context' },
   { number: '-', text: '  debug: true,', kind: 'removed' },
   { number: '4', text: '  headers: { "Content-Type": "application/json" },', kind: 'added' },
   { number: '5', text: '};', kind: 'context' },
   { number: '-', text: 'async function fetchUser(id: string): Promise<User> {', kind: 'removed' },
   { number: '-', text: '  const url = `${config.apiUrl}/users/${id}`;', kind: 'removed' },
   {
      number: '6',
      text: 'async function fetchUser(id: string): Promise<User | null> {',
      kind: 'added',
   },
   { number: '7', text: '  const url = `${config.apiUrl}/v2/users/${id}`;', kind: 'added' },
   { number: '8', text: '  const res = await fetch(url);', kind: 'context' },
   { number: '-', text: '  return res.json();', kind: 'removed' },
];

/** Personal "Code & reviews" settings (PR reviews inside the app). */
export default function AccountCodeReviews() {
   const t = useTranslations('settings');
   return (
      <SettingsShell title={t('codeReviews.title')} description={t('codeReviews.description')}>
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title={t('codeReviews.enableCodeReviews')}
                  description={t('codeReviews.enableCodeReviewsDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('codeReviews.autoConvertDrafts')}
                  description={t('codeReviews.autoConvertDraftsDesc')}
                  trailing={<Switch />}
               />
               <SettingsRow
                  title={t('codeReviews.mergeStrategy')}
                  description={t('codeReviews.mergeStrategyDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('codeReviews.mergeStrategyOptions.squash'),
                           t('codeReviews.mergeStrategyOptions.mergeCommit'),
                           t('codeReviews.mergeStrategyOptions.rebaseMerge'),
                        ]}
                     />
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title={t('codeReviews.codeTheme')}
                  description={t('codeReviews.codeThemeDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('codeReviews.codeThemeOptions.light'),
                           t('codeReviews.codeThemeOptions.dark'),
                           t('codeReviews.codeThemeOptions.contrast'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('codeReviews.font')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('codeReviews.fontOptions.regular'),
                           t('codeReviews.fontOptions.medium'),
                        ]}
                     />
                  }
               />
               <div className="p-3">
                  <div className="relative rounded-md border overflow-hidden bg-container">
                     <div className="absolute top-2 right-2 z-10">
                        <SelectMenu
                           options={[
                              t('codeReviews.diffLanguages.typescript'),
                              t('codeReviews.diffLanguages.javascript'),
                              t('codeReviews.diffLanguages.python'),
                           ]}
                        />
                     </div>
                     <pre className="text-xs leading-5 font-mono overflow-x-auto py-2">
                        {DIFF_LINES.map((line, index) => (
                           <div
                              key={index}
                              className={
                                 line.kind === 'removed'
                                    ? 'bg-red-500/10 border-l-2 border-red-500 px-3 flex gap-3'
                                    : line.kind === 'added'
                                      ? 'bg-green-500/10 border-l-2 border-green-500 px-3 flex gap-3'
                                      : 'px-3 flex gap-3 border-l-2 border-transparent'
                              }
                           >
                              <span className="w-4 text-right text-muted-foreground/60 select-none shrink-0">
                                 {line.number}
                              </span>
                              <code>{line.text}</code>
                           </div>
                        ))}
                     </pre>
                  </div>
               </div>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title={t('codeReviews.notifications.title')}
            description={t('codeReviews.notifications.description')}
         >
            <SettingsCard>
               <SettingsRow
                  title={t('codeReviews.notifications.commentsReviews')}
                  description={t('codeReviews.notifications.commentsReviewsDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('codeReviews.notifications.commentsReviewsOptions.excludeBots'),
                           t('codeReviews.notifications.commentsReviewsOptions.everyone'),
                           t('codeReviews.notifications.commentsReviewsOptions.none'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('codeReviews.notifications.reviewRequests')}
                  description={t('codeReviews.notifications.reviewRequestsDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('codeReviews.notifications.githubTeamReviewRequests')}
                  description={t('codeReviews.notifications.githubTeamReviewRequestsDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('codeReviews.notifications.checksMergeQueue')}
                  description={t('codeReviews.notifications.checksMergeQueueDesc')}
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('codeReviews.signedCommits.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('codeReviews.signedCommits.requireSigned')}
                  description={t('codeReviews.signedCommits.requireSignedDesc')}
                  trailing={<Switch />}
               />
               <SettingsRow
                  title={t('codeReviews.signedCommits.noSigningKey')}
                  trailing={
                     <Button size="xs" variant="ghost">
                        {t('codeReviews.signedCommits.addKey')}
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('codeReviews.externalTools.title')}>
            <SettingsCard>
               <SettingsRow
                  title={t('codeReviews.externalTools.configureTools')}
                  description={t('codeReviews.externalTools.configureToolsDesc')}
                  trailing={<ChevronRight className="size-4" />}
                  onClick={() => {}}
               />
               <SettingsRow
                  title={t('codeReviews.externalTools.gitAttachmentFormat')}
                  description={t('codeReviews.externalTools.gitAttachmentFormatDesc')}
                  trailing={
                     <SelectMenu
                        options={[
                           t('codeReviews.externalTools.gitAttachmentFormatOptions.title'),
                           t('codeReviews.externalTools.gitAttachmentFormatOptions.url'),
                           t('codeReviews.externalTools.gitAttachmentFormatOptions.compact'),
                        ]}
                     />
                  }
               />
               <SettingsRow
                  title={t('codeReviews.externalTools.branchCopyStatus')}
                  description={t('codeReviews.externalTools.branchCopyStatusDesc')}
                  trailing={<Switch defaultChecked />}
               />
               <SettingsRow
                  title={t('codeReviews.externalTools.openInToolStatus')}
                  description={t('codeReviews.externalTools.openInToolStatusDesc')}
                  trailing={<Switch defaultChecked />}
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
