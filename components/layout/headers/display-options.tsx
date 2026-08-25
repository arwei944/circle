'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
   CompletedIssuesFilter,
   DISPLAY_PROPERTIES,
   GroupingKey,
   OrderingKey,
   useDisplaySettingsStore,
} from '@/store/display-settings-store';
import { useViewStore } from '@/store/view-store';
import {
   ArrowUpNarrowWide,
   ArrowUpDown,
   LayoutGrid,
   LayoutList,
   SlidersHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const GROUPINGS: { value: GroupingKey }[] = [
   { value: 'status' },
   { value: 'assignee' },
   { value: 'priority' },
   { value: 'project' },
   { value: 'none' },
];

const ORDERINGS: { value: OrderingKey }[] = [
   { value: 'priority' },
   { value: 'created' },
   { value: 'title' },
];

/**
 * Linear-style "Display" popover: list/board switch, grouping, ordering,
 * completed-issue visibility, list options and display property chips.
 */
export function DisplayOptions() {
   const { viewType, setViewType } = useViewStore();
   const {
      grouping,
      ordering,
      orderCompletedByRecency,
      completedIssues,
      showSubIssues,
      showEmptyGroups,
      displayProperties,
      setGrouping,
      setOrdering,
      setOrderCompletedByRecency,
      setCompletedIssues,
      setShowSubIssues,
      setShowEmptyGroups,
      toggleDisplayProperty,
      resetDisplaySettings,
   } = useDisplaySettingsStore();
   const t = useTranslations('issues');

   const isDefault =
      grouping === 'status' &&
      ordering === 'priority' &&
      completedIssues === 'all' &&
      !showEmptyGroups;

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button className="relative" size="xs" variant="secondary">
               <SlidersHorizontal className="size-4 mr-1" />
               {t('display.button')}
               {(!isDefault || viewType === 'grid') && (
                  <span className="absolute right-0 top-0 w-2 h-2 bg-orange-500 rounded-full" />
               )}
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-80 p-0" align="end">
            {/* List / Board switch */}
            <div className="p-3">
               <div className="grid grid-cols-2 gap-1 bg-accent/50 rounded-md p-1">
                  <button
                     onClick={() => setViewType('list')}
                     className={cn(
                        'flex items-center justify-center gap-1.5 h-8 rounded text-xs font-medium transition-colors',
                        viewType === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                     )}
                  >
                     <LayoutList className="size-3.5" />
                     {t('display.list')}
                  </button>
                  <button
                     onClick={() => setViewType('grid')}
                     className={cn(
                        'flex items-center justify-center gap-1.5 h-8 rounded text-xs font-medium transition-colors',
                        viewType === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                     )}
                  >
                     <LayoutGrid className="size-3.5" />
                     {t('display.board')}
                  </button>
               </div>
            </div>

            {/* Grouping & ordering */}
            <div className="px-3 pb-3 flex flex-col gap-2.5">
               <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <ArrowUpDown className="size-3.5" />
                     {t('display.grouping')}
                  </span>
                  <Select value={grouping} onValueChange={(v) => setGrouping(v as GroupingKey)}>
                     <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {GROUPINGS.map((option) => (
                           <SelectItem key={option.value} value={option.value} className="text-xs">
                              {t(`display.group.${option.value}`)}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground pl-5">
                     {t('display.subGrouping')}
                  </span>
                  <Select value="none" disabled>
                     <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue placeholder={t('display.noGrouping')} />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="none" className="text-xs">
                           {t('display.noGrouping')}
                        </SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <ArrowUpNarrowWide className="size-3.5" />
                     {t('display.ordering')}
                  </span>
                  <Select value={ordering} onValueChange={(v) => setOrdering(v as OrderingKey)}>
                     <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {ORDERINGS.map((option) => (
                           <SelectItem key={option.value} value={option.value} className="text-xs">
                              {t(`display.order.${option.value}`)}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between">
                  <Label
                     htmlFor="order-completed-recency"
                     className="text-xs text-muted-foreground font-normal"
                  >
                     {t('display.orderCompletedByRecency')}
                  </Label>
                  <Switch
                     id="order-completed-recency"
                     checked={orderCompletedByRecency}
                     onCheckedChange={setOrderCompletedByRecency}
                  />
               </div>
            </div>

            <div className="border-t px-3 py-3 flex flex-col gap-2.5">
               <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                     {t('display.completedIssues')}
                  </span>
                  <Select
                     value={completedIssues}
                     onValueChange={(v) => setCompletedIssues(v as CompletedIssuesFilter)}
                  >
                     <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all" className="text-xs">
                           {t('display.all')}
                        </SelectItem>
                        <SelectItem value="none" className="text-xs">
                           {t('display.none')}
                        </SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex items-center justify-between">
                  <Label
                     htmlFor="show-sub-issues"
                     className="text-xs text-muted-foreground font-normal"
                  >
                     {t('display.showSubIssues')}
                  </Label>
                  <Switch
                     id="show-sub-issues"
                     checked={showSubIssues}
                     onCheckedChange={setShowSubIssues}
                  />
               </div>
            </div>

            <div className="border-t px-3 py-3 flex flex-col gap-2.5">
               <span className="text-xs font-medium">{t('display.listOptions')}</span>
               <div className="flex items-center justify-between">
                  <Label
                     htmlFor="show-empty-groups"
                     className="text-xs text-muted-foreground font-normal"
                  >
                     {t('display.showEmptyGroups')}
                  </Label>
                  <Switch
                     id="show-empty-groups"
                     checked={showEmptyGroups}
                     onCheckedChange={setShowEmptyGroups}
                  />
               </div>

               <span className="text-xs text-muted-foreground mt-1">
                  {t('display.displayProperties')}
               </span>
               <div className="flex flex-wrap gap-1.5">
                  {DISPLAY_PROPERTIES.map((property) => (
                     <button
                        key={property.key}
                        onClick={() => toggleDisplayProperty(property.key)}
                        className={cn(
                           'px-2 h-6 rounded-md text-xs border transition-colors',
                           displayProperties[property.key]
                              ? 'bg-accent border-border text-foreground'
                              : 'border-transparent bg-accent/40 text-muted-foreground hover:text-foreground'
                        )}
                     >
                        {t(`display.properties.${property.key}`)}
                     </button>
                  ))}
               </div>
            </div>

            <div className="border-t px-3 py-2.5 flex items-center justify-between">
               <button
                  onClick={resetDisplaySettings}
                  className="text-xs text-muted-foreground hover:text-foreground"
               >
                  {t('display.reset')}
               </button>
               <button className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
                  {t('display.setDefaultForEveryone')}
               </button>
            </div>
         </PopoverContent>
      </Popover>
   );
}
