'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
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
   countCompletedProjects,
   getInitiativeProjects,
   Initiative,
   INITIATIVE_STATUS_META,
   initiatives as allInitiatives,
   InitiativeStatus,
} from '@/mock-data/initiatives';
import { priorities } from '@/mock-data/priorities';
import { health as allHealth } from '@/mock-data/projects';
import { users } from '@/mock-data/users';
import { InitiativesFilterType, useInitiativesFilterStore } from '@/store/initiatives-filter-store';
import {
   InitiativesDisplayProperties,
   useInitiativesDisplayStore,
} from '@/store/initiatives-display-store';
import {
   BadgeCheck,
   CheckIcon,
   ChevronRight,
   HeartPulse,
   ListFilter,
   PanelRight,
   SlidersHorizontal,
   UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import { InitiativeStatusIcon } from './initiative-status-icon';
import { InitiativesSidePanel } from './initiatives-side-panel';

const TABS = ['active', 'planned', 'all'] as const;

const TAB_ITEMS: { labelKey: string; value: (typeof TABS)[number] }[] = [
   { labelKey: 'active', value: 'active' },
   { labelKey: 'planned', value: 'planned' },
   { labelKey: 'all', value: 'all' },
];

/* --------------------------------- filter --------------------------------- */

function InitiativesFilter() {
   const [open, setOpen] = useState(false);
   const [active, setActive] = useState<InitiativesFilterType | null>(null);
   const { filters, toggleFilter, clearFilters, getActiveFiltersCount } =
      useInitiativesFilterStore();

   const count = getActiveFiltersCount();
   const t = useTranslations('initiatives');

   return (
      <Popover
         open={open}
         onOpenChange={(next) => {
            setOpen(next);
            if (!next) setActive(null);
         }}
      >
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost" className="relative">
               <ListFilter className="size-4" />
               {count > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[9px] inline-flex items-center justify-center">
                     {count}
                  </span>
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-60 p-0">
            <Command>
               <CommandInput
                  placeholder={active ? t('filter.searchPlaceholder') : t('filter.addPlaceholder')}
               />
               <CommandList>
                  <CommandEmpty>{t('filter.noResults')}</CommandEmpty>
                  {!active && (
                     <CommandGroup>
                        <CommandItem onSelect={() => setActive('status')}>
                           <BadgeCheck className="size-4 text-muted-foreground" />
                           {t('filter.status')}
                           <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </CommandItem>
                        <CommandItem onSelect={() => setActive('priority')}>
                           <SlidersHorizontal className="size-4 text-muted-foreground" />
                           {t('filter.priority')}
                           <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </CommandItem>
                        <CommandItem onSelect={() => setActive('owner')}>
                           <UserRound className="size-4 text-muted-foreground" />
                           {t('filter.owner')}
                           <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </CommandItem>
                        <CommandItem onSelect={() => setActive('health')}>
                           <HeartPulse className="size-4 text-muted-foreground" />
                           {t('filter.health')}
                           <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </CommandItem>
                        {count > 0 && (
                           <CommandItem onSelect={() => clearFilters()}>
                              {t('filter.clearFilters')}
                           </CommandItem>
                        )}
                     </CommandGroup>
                  )}
                  {active === 'status' && (
                     <CommandGroup>
                        {(Object.keys(INITIATIVE_STATUS_META) as InitiativeStatus[]).map(
                           (statusId) => (
                              <CommandItem
                                 key={statusId}
                                 onSelect={() => toggleFilter('status', statusId)}
                              >
                                 <InitiativeStatusIcon status={statusId} />
                                 {INITIATIVE_STATUS_META[statusId].label}
                                 {filters.status.includes(statusId) && (
                                    <CheckIcon className="ml-auto size-3.5" />
                                 )}
                              </CommandItem>
                           )
                        )}
                     </CommandGroup>
                  )}
                  {active === 'priority' && (
                     <CommandGroup>
                        {priorities.map((priority) => (
                           <CommandItem
                              key={priority.id}
                              onSelect={() => toggleFilter('priority', priority.id)}
                           >
                              <priority.icon className="size-4 text-muted-foreground" />
                              {priority.name}
                              {filters.priority.includes(priority.id) && (
                                 <CheckIcon className="ml-auto size-3.5" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
                  {active === 'owner' && (
                     <CommandGroup>
                        {users.slice(0, 10).map((user) => (
                           <CommandItem
                              key={user.id}
                              onSelect={() => toggleFilter('owner', user.id)}
                           >
                              <Avatar className="size-4">
                                 <AvatarImage src={user.avatarUrl} alt={user.name} />
                                 <AvatarFallback className="text-[8px]">
                                    {user.name[0]}
                                 </AvatarFallback>
                              </Avatar>
                              {user.name}
                              {filters.owner.includes(user.id) && (
                                 <CheckIcon className="ml-auto size-3.5" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
                  {active === 'health' && (
                     <CommandGroup>
                        {allHealth.map((entry) => (
                           <CommandItem
                              key={entry.id}
                              onSelect={() => toggleFilter('health', entry.id)}
                           >
                              <span
                                 className="size-2.5 rounded-full"
                                 style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}
                              {filters.health.includes(entry.id) && (
                                 <CheckIcon className="ml-auto size-3.5" />
                              )}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

/* ----------------------------- display options ---------------------------- */

const PROPERTY_CHIPS: { key: keyof InitiativesDisplayProperties; labelKey: string }[] = [
   { key: 'description', labelKey: 'description' },
   { key: 'status', labelKey: 'status' },
   { key: 'priority', labelKey: 'priority' },
   { key: 'owner', labelKey: 'owner' },
   { key: 'target', labelKey: 'targetDate' },
   { key: 'projects', labelKey: 'projects' },
   { key: 'health', labelKey: 'health' },
   { key: 'activeProjects', labelKey: 'activeProjects' },
];

function InitiativesDisplayOptions() {
   const { grouping, ordering, displayProperties, setGrouping, setOrdering, toggleProperty } =
      useInitiativesDisplayStore();
   const t = useTranslations('initiatives');

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost">
               <SlidersHorizontal className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-80 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">{t('display.grouping')}</span>
               <Select
                  value={grouping}
                  onValueChange={(value) => setGrouping(value as typeof grouping)}
               >
                  <SelectTrigger className="w-36 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">{t('display.noGrouping')}</SelectItem>
                     <SelectItem value="status">{t('filter.status')}</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">{t('display.ordering')}</span>
               <Select
                  value={ordering}
                  onValueChange={(value) => setOrdering(value as typeof ordering)}
               >
                  <SelectTrigger className="w-36 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="manual">{t('display.manual')}</SelectItem>
                     <SelectItem value="name">{t('display.name')}</SelectItem>
                     <SelectItem value="target">{t('table.targetDate')}</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="flex flex-col gap-2">
               <span className="text-xs text-muted-foreground">
                  {t('display.displayProperties')}
               </span>
               <div className="flex flex-wrap gap-1.5">
                  {PROPERTY_CHIPS.map(({ key, labelKey }) => (
                     <button
                        key={key}
                        onClick={() => toggleProperty(key)}
                        className={cn(
                           'px-2 py-0.5 rounded-md border text-xs transition-colors',
                           displayProperties[key]
                              ? 'bg-accent border-transparent'
                              : 'text-muted-foreground hover:bg-accent/50'
                        )}
                     >
                        {t(`display.properties.${labelKey}`)}
                     </button>
                  ))}
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}

/* ---------------------------------- rows ---------------------------------- */

const ACTIVE_DOT_COLORS: Record<string, string> = {
   'no-update': '#95a2b3',
   'on-track': '#4cb782',
   'at-risk': '#f2c94c',
   'off-track': '#eb5757',
};

function ActiveProjectDots({ initiative }: { initiative: Initiative }) {
   const started = getInitiativeProjects(initiative).filter(
      (project) => project.status.category === 'started'
   );
   const byHealth = new Map<string, number>();
   for (const project of started) {
      byHealth.set(project.health.id, (byHealth.get(project.health.id) ?? 0) + 1);
   }
   return (
      <span className="flex items-center gap-2">
         {[...byHealth.entries()].map(([healthId, count]) => (
            <span key={healthId} className="inline-flex items-center gap-1 text-xs">
               <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: ACTIVE_DOT_COLORS[healthId] ?? '#95a2b3' }}
               />
               {count}
            </span>
         ))}
      </span>
   );
}

function InitiativeRow({
   initiative,
   orgId,
   showStatus,
}: {
   initiative: Initiative;
   orgId: string;
   showStatus: boolean;
}) {
   const { displayProperties } = useInitiativesDisplayStore();
   const t = useTranslations('initiatives');
   const projects = getInitiativeProjects(initiative);
   const completed = countCompletedProjects(initiative);

   return (
      <Link
         href={`/${orgId}/initiative/${initiative.id}`}
         className="flex items-center gap-2 px-6 py-2 border-b border-border/50 hover:bg-sidebar/50 transition-colors text-sm"
      >
         <span className="inline-flex size-6 items-center justify-center rounded bg-muted/50 text-sm shrink-0">
            {initiative.icon}
         </span>
         <span className="flex flex-col min-w-0 flex-1">
            <span className="font-medium truncate">{initiative.name}</span>
            {displayProperties.description && initiative.description && (
               <span className="text-xs text-muted-foreground truncate">
                  {initiative.description}
               </span>
            )}
         </span>
         {showStatus && displayProperties.status && (
            <span className="hidden md:flex items-center gap-1.5 w-28 shrink-0 text-xs">
               <InitiativeStatusIcon status={initiative.status} />
               {INITIATIVE_STATUS_META[initiative.status].label}
            </span>
         )}
         {displayProperties.priority && (
            <span className="hidden sm:flex w-16 shrink-0 items-center">
               <initiative.priority.icon className="size-4 text-muted-foreground" />
            </span>
         )}
         {displayProperties.owner && (
            <span className="hidden sm:flex w-14 shrink-0">
               {initiative.owner ? (
                  <Avatar className="size-5">
                     <AvatarImage src={initiative.owner.avatarUrl} alt={initiative.owner.name} />
                     <AvatarFallback className="text-[9px]">
                        {initiative.owner.name[0]}
                     </AvatarFallback>
                  </Avatar>
               ) : (
                  <UserRound className="size-4 text-muted-foreground" />
               )}
            </span>
         )}
         {displayProperties.target && (
            <span className="hidden md:block w-20 shrink-0 text-xs text-muted-foreground">
               {initiative.target ?? '—'}
            </span>
         )}
         {displayProperties.projects && (
            <span className="hidden md:flex items-center gap-1 w-16 shrink-0 text-xs text-muted-foreground">
               <BadgeCheck className="size-3.5 text-violet-400" />
               {completed} / {projects.length}
            </span>
         )}
         {displayProperties.health && (
            <span className="hidden xl:flex items-center gap-1.5 w-28 shrink-0 text-xs text-muted-foreground">
               <span
                  className={cn(
                     'size-3.5 rounded-full border-2 shrink-0',
                     initiative.health.id === 'no-update' && 'border-muted-foreground/40'
                  )}
                  style={
                     initiative.health.id !== 'no-update'
                        ? { borderColor: initiative.health.color }
                        : undefined
                  }
               />
               {initiative.health.id === 'no-update'
                  ? t('health.noUpdates')
                  : initiative.health.name}
            </span>
         )}
         {displayProperties.activeProjects && (
            <span className="hidden xl:block w-24 shrink-0">
               <ActiveProjectDots initiative={initiative} />
            </span>
         )}
      </Link>
   );
}

/* ---------------------------------- page ---------------------------------- */

export default function Initiatives() {
   const { orgId } = useParams<{ orgId: string }>();
   const t = useTranslations('initiatives');
   const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(TABS).withDefault('active'));
   const { filters } = useInitiativesFilterStore();
   const { grouping, ordering, displayProperties } = useInitiativesDisplayStore();
   const [showPanel, setShowPanel] = useState(true);

   const displayed = useMemo(() => {
      let list = allInitiatives.slice();
      if (tab !== 'all') list = list.filter((initiative) => initiative.status === tab);
      if (filters.status.length > 0) {
         list = list.filter((initiative) => filters.status.includes(initiative.status));
      }
      if (filters.priority.length > 0) {
         list = list.filter((initiative) => filters.priority.includes(initiative.priority.id));
      }
      if (filters.owner.length > 0) {
         list = list.filter(
            (initiative) => initiative.owner && filters.owner.includes(initiative.owner.id)
         );
      }
      if (filters.health.length > 0) {
         list = list.filter((initiative) => filters.health.includes(initiative.health.id));
      }
      if (ordering === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
      else if (ordering === 'target')
         list.sort((a, b) => (a.target ?? '').localeCompare(b.target ?? ''));
      return list;
   }, [tab, filters, ordering]);

   const groups = useMemo(() => {
      if (grouping !== 'status') return null;
      return (Object.keys(INITIATIVE_STATUS_META) as InitiativeStatus[])
         .map((statusId) => ({
            statusId,
            items: displayed.filter((initiative) => initiative.status === statusId),
         }))
         .filter((group) => group.items.length > 0);
   }, [grouping, displayed]);

   const showStatus = tab === 'all';

   return (
      <div className="w-full h-full flex overflow-hidden">
         <div className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-3 pb-2 sticky top-0 bg-background z-10">
               <div className="flex items-center gap-1.5">
                  {TAB_ITEMS.map((item) => (
                     <button
                        key={item.value}
                        onClick={() => setTab(item.value)}
                        className={cn(
                           'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                           tab === item.value
                              ? 'bg-accent border-transparent'
                              : 'text-muted-foreground hover:bg-accent/50'
                        )}
                     >
                        {t(`listTabs.${item.labelKey}`)}
                     </button>
                  ))}
               </div>
               <div className="flex items-center gap-1">
                  <InitiativesFilter />
                  <InitiativesDisplayOptions />
                  <Button
                     size="xs"
                     variant={showPanel ? 'secondary' : 'ghost'}
                     onClick={() => setShowPanel((value) => !value)}
                  >
                     <PanelRight className="size-4" />
                  </Button>
               </div>
            </div>

            <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-muted-foreground border-b">
               <span className="flex-1">{t('table.name')}</span>
               {showStatus && displayProperties.status && (
                  <span className="hidden md:block w-28 shrink-0">{t('table.status')}</span>
               )}
               {displayProperties.priority && (
                  <span className="hidden sm:block w-16 shrink-0">{t('table.priority')}</span>
               )}
               {displayProperties.owner && (
                  <span className="hidden sm:block w-14 shrink-0">{t('table.owner')}</span>
               )}
               {displayProperties.target && (
                  <span className="hidden md:block w-20 shrink-0">{t('table.target')}</span>
               )}
               {displayProperties.projects && (
                  <span className="hidden md:block w-16 shrink-0">{t('table.projects')}</span>
               )}
               {displayProperties.health && (
                  <span className="hidden xl:block w-28 shrink-0">{t('table.health')}</span>
               )}
               {displayProperties.activeProjects && (
                  <span className="hidden xl:block w-24 shrink-0">{t('table.activeProjects')}</span>
               )}
            </div>

            {groups
               ? groups.map((group) => (
                    <div key={group.statusId}>
                       <div className="flex items-center gap-2 px-6 h-9 text-sm font-medium bg-[color-mix(in_oklab,var(--accent)_30%,var(--container))] border-b border-border/40">
                          <InitiativeStatusIcon status={group.statusId} />
                          {INITIATIVE_STATUS_META[group.statusId].label}
                          <span className="text-xs text-muted-foreground">
                             {group.items.length}
                          </span>
                       </div>
                       {group.items.map((initiative) => (
                          <InitiativeRow
                             key={initiative.id}
                             initiative={initiative}
                             orgId={orgId}
                             showStatus={showStatus}
                          />
                       ))}
                    </div>
                 ))
               : displayed.map((initiative) => (
                    <InitiativeRow
                       key={initiative.id}
                       initiative={initiative}
                       orgId={orgId}
                       showStatus={showStatus}
                    />
                 ))}
         </div>
         {showPanel && <InitiativesSidePanel initiatives={displayed} />}
      </div>
   );
}
