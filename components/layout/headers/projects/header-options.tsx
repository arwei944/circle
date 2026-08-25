'use client';

import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Filter } from './filter';

export default function HeaderOptions() {
   const t = useTranslations('projects');
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <Filter />
         <Button className="relative" size="xs" variant="secondary">
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline ml-1">{t('projectsHeader.display')}</span>
         </Button>
      </div>
   );
}
