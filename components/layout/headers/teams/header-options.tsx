'use client';

import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Filter } from './filter';

export default function HeaderOptions() {
   const t = useTranslations('teams');

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <Filter />
         <Button className="relative" size="xs" variant="secondary">
            <SlidersHorizontal className="size-4 mr-1" />
            {t('teamsPage.display')}
         </Button>
      </div>
   );
}
