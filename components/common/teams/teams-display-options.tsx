'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
   TEAM_DISPLAY_PROPERTIES,
   TeamsOrdering,
   useTeamsDisplayStore,
} from '@/store/teams-display-store';
import { ArrowUpNarrowWide, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ORDERINGS: { value: TeamsOrdering }[] = [
   { value: 'name' },
   { value: 'members' },
   { value: 'projects' },
];

/** Linear-style Display popover for the Teams page. */
export function TeamsDisplayOptions() {
   const { ordering, displayProperties, setOrdering, toggleDisplayProperty } =
      useTeamsDisplayStore();
   const t = useTranslations('teams');

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost" aria-label={t('displayOptions.ariaLabel')}>
               <SlidersHorizontal className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-80 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
               <span className="flex items-center gap-2 text-sm">
                  <ArrowUpNarrowWide className="size-4 text-muted-foreground" />
                  {t('displayOptions.ordering')}
               </span>
               <Select
                  value={ordering}
                  onValueChange={(value) => setOrdering(value as TeamsOrdering)}
               >
                  <SelectTrigger className="h-8 w-32 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {ORDERINGS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                           {t(`columns.${option.value}`)}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="flex flex-col gap-2">
               <span className="text-sm text-muted-foreground">
                  {t('displayOptions.displayProperties')}
               </span>
               <div className="flex flex-wrap gap-1.5">
                  {TEAM_DISPLAY_PROPERTIES.map((property) => {
                     const enabled = displayProperties[property.key];
                     return (
                        <button
                           key={property.key}
                           type="button"
                           onClick={() => toggleDisplayProperty(property.key)}
                           className={cn(
                              'px-2.5 h-7 rounded-full border text-xs transition-colors',
                              enabled
                                 ? 'bg-accent text-foreground border-border'
                                 : 'border-border/60 text-muted-foreground hover:text-foreground'
                           )}
                        >
                           {t(`columns.${property.key}`)}
                        </button>
                     );
                  })}
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}
