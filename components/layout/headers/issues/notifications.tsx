'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RiSlackLine } from '@remixicon/react';

export default function Notifications() {
   const [notifications, setNotifications] = useState({
      teamIssueAdded: false,
      issueCompleted: false,
      issueAddedToTriage: false,
   });
   const t = useTranslations('issues');

   const handleCheckboxChange = (key: keyof typeof notifications) => {
      setNotifications((prev) => ({
         ...prev,
         [key]: !prev[key],
      }));
   };

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8 relative"
               aria-label={t('notifications.label')}
            >
               <Bell className="h-4 w-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-80 p-0" align="end">
            <div className="px-4 pt-3 pb-3">
               <h3 className="text-sm font-medium mb-3">{t('notifications.title')}</h3>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label
                        htmlFor="team-issue-added"
                        className="text-xs text-muted-foreground cursor-pointer flex-1"
                     >
                        {t('notifications.issueAddedToTeam')}
                     </label>
                     <Checkbox
                        id="team-issue-added"
                        checked={notifications.teamIssueAdded}
                        onCheckedChange={() => handleCheckboxChange('teamIssueAdded')}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                     <label
                        htmlFor="issue-completed"
                        className="text-xs text-muted-foreground cursor-pointer flex-1"
                     >
                        {t('notifications.issueCompletedOrCanceled')}
                     </label>
                     <Checkbox
                        id="issue-completed"
                        checked={notifications.issueCompleted}
                        onCheckedChange={() => handleCheckboxChange('issueCompleted')}
                     />
                  </div>

                  <div className="flex items-center justify-between">
                     <label
                        htmlFor="issue-triage"
                        className="text-xs text-muted-foreground cursor-pointer flex-1"
                     >
                        {t('notifications.issueAddedToTriage')}
                     </label>
                     <Checkbox
                        id="issue-triage"
                        checked={notifications.issueAddedToTriage}
                        onCheckedChange={() => handleCheckboxChange('issueAddedToTriage')}
                     />
                  </div>
               </div>
            </div>

            <div className="border-t py-2 px-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <RiSlackLine className="size-4" />
                  <span className="text-xs font-medium">
                     {t('notifications.slackNotifications')}
                  </span>
               </div>
               <Button size="xs" variant="outline">
                  {t('notifications.configure')}
               </Button>
            </div>
         </PopoverContent>
      </Popover>
   );
}
