'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTranslations } from 'next-intl';

export default function HeaderNav() {
   const t = useTranslations('settings');
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">{t('nav.settings')}</span>
            </div>
         </div>
      </div>
   );
}
