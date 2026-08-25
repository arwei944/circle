'use client';

import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Header() {
   const t = useTranslations('views');
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-sm font-medium">{t('title')}</span>
         </div>
         <Button size="xs" variant="ghost">
            <Plus className="size-4" />
         </Button>
      </div>
   );
}
