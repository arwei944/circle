'use client';

import { Button } from '@/components/ui/button';
import {
   Command,
   CommandGroup,
   CommandItem,
   CommandList,
   CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMembersFilterStore } from '@/store/members-filter-store';
import { useState } from 'react';
import { ArrowUpDown, CheckIcon, ChevronRight, ListFilter, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

type FilterType = 'role' | 'sort';

const ROLES: Array<'Guest' | 'Member' | 'Admin' | 'Application'> = [
   'Guest',
   'Member',
   'Admin',
   'Application',
];

export function Filter() {
   const [open, setOpen] = useState(false);
   const [active, setActive] = useState<FilterType | null>(null);

   const { filters, sort, toggleFilter, clearFilters, getActiveFiltersCount, setSort } =
      useMembersFilterStore();
   const t = useTranslations('members');

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost" className="relative">
               <ListFilter className="size-4 mr-1" />
               {t('filter.button')}
               {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full size-4 flex items-center justify-center">
                     {getActiveFiltersCount()}
                  </span>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent className="p-0 w-60" align="start">
            {active === null ? (
               <Command>
                  <CommandList>
                     <CommandGroup>
                        <CommandItem
                           onSelect={() => setActive('role')}
                           className="flex items-center justify-between cursor-pointer"
                        >
                           <span className="flex items-center gap-2">
                              <Shield className="size-4 text-muted-foreground" />
                              {t('filter.status')}
                           </span>
                           <div className="flex items-center">
                              {filters.role.length > 0 && (
                                 <span className="text-xs text-muted-foreground mr-1">
                                    {filters.role.length}
                                 </span>
                              )}
                              <ChevronRight className="size-4" />
                           </div>
                        </CommandItem>
                        <CommandItem
                           onSelect={() => setActive('sort')}
                           className="flex items-center justify-between cursor-pointer"
                        >
                           <span className="flex items-center gap-2">
                              <ArrowUpDown className="size-4 text-muted-foreground" />
                              {t('filter.sortBy')}
                           </span>
                           <ChevronRight className="size-4" />
                        </CommandItem>
                     </CommandGroup>
                     {getActiveFiltersCount() > 0 && (
                        <>
                           <CommandSeparator />
                           <CommandGroup>
                              <CommandItem
                                 onSelect={() => clearFilters()}
                                 className="cursor-pointer"
                              >
                                 {t('filter.clearAll')}
                              </CommandItem>
                           </CommandGroup>
                        </>
                     )}
                  </CommandList>
               </Command>
            ) : active === 'role' ? (
               <Command>
                  <div className="flex items-center border-b p-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setActive(null)}
                     >
                        <ChevronRight className="size-4 rotate-180" />
                     </Button>
                     <span className="ml-2 font-medium">{t('filter.status')}</span>
                  </div>
                  <CommandList>
                     <CommandGroup>
                        {ROLES.map((role) => (
                           <CommandItem
                              key={role}
                              value={role}
                              onSelect={() => toggleFilter('role', role)}
                              className="flex items-center justify-between"
                           >
                              {role}
                              {filters.role.includes(role) && <CheckIcon size={16} />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            ) : active === 'sort' ? (
               <Command>
                  <div className="flex items-center border-b p-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setActive(null)}
                     >
                        <ChevronRight className="size-4 rotate-180" />
                     </Button>
                     <span className="ml-2 font-medium">{t('filter.sortBy')}</span>
                  </div>
                  <CommandList>
                     <CommandGroup heading={t('filter.name')}>
                        <CommandItem
                           onSelect={() => setSort('name-asc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.az')}
                           {sort === 'name-asc' && <CheckIcon size={16} />}
                        </CommandItem>
                        <CommandItem
                           onSelect={() => setSort('name-desc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.za')}
                           {sort === 'name-desc' && <CheckIcon size={16} />}
                        </CommandItem>
                     </CommandGroup>
                     <CommandSeparator />
                     <CommandGroup heading={t('filter.joined')}>
                        <CommandItem
                           onSelect={() => setSort('joined-asc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.oldestToNewest')}
                           {sort === 'joined-asc' && <CheckIcon size={16} />}
                        </CommandItem>
                        <CommandItem
                           onSelect={() => setSort('joined-desc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.newestToOldest')}
                           {sort === 'joined-desc' && <CheckIcon size={16} />}
                        </CommandItem>
                     </CommandGroup>
                     <CommandSeparator />
                     <CommandGroup heading={t('filter.teams')}>
                        <CommandItem
                           onSelect={() => setSort('teams-asc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.lowestToHighest')}
                           {sort === 'teams-asc' && <CheckIcon size={16} />}
                        </CommandItem>
                        <CommandItem
                           onSelect={() => setSort('teams-desc')}
                           className="flex items-center justify-between"
                        >
                           {t('filter.highestToLowest')}
                           {sort === 'teams-desc' && <CheckIcon size={16} />}
                        </CommandItem>
                     </CommandGroup>
                  </CommandList>
               </Command>
            ) : null}
         </PopoverContent>
      </Popover>
   );
}
