'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import type { ColumnOption, FiltersState } from '@/components/data-table-filter/core/types';
import { multiOptionFilterFn, optionFilterFn } from '@/components/data-table-filter/lib/filter-fns';
import { cycles, cycleStatusLabel } from '@/mock-data/cycles';
import { Issue } from '@/mock-data/issues';
import { labels } from '@/mock-data/labels';
import { priorities } from '@/mock-data/priorities';
import { status, StatusCategory } from '@/mock-data/status';
import { users } from '@/mock-data/users';
import { iconByIndex } from '@/lib/project-icons';
import type { LeanProjectAgg } from '@/lib/dto';
import {
   BarChart3,
   CircleCheck,
   CircleDashed,
   CircleUserRound,
   Folder,
   RefreshCcw,
   Tag,
} from 'lucide-react';
import type { TranslationValues } from 'next-intl';

type TranslateFn = (key: string, values?: TranslationValues) => string;

/* -------------------------------------------------------------------------- */
/*                                Option lists                                */
/* -------------------------------------------------------------------------- */

const statusOptions: ColumnOption[] = status.map((item) => ({
   value: item.id,
   label: item.name,
   icon: <item.icon />,
}));

const STATUS_TYPES: { id: StatusCategory; labelKey: string }[] = [
   { id: 'triage', labelKey: 'filter.statusTypes.triage' },
   { id: 'backlog', labelKey: 'filter.statusTypes.backlog' },
   { id: 'unstarted', labelKey: 'filter.statusTypes.unstarted' },
   { id: 'started', labelKey: 'filter.statusTypes.started' },
   { id: 'completed', labelKey: 'filter.statusTypes.completed' },
   { id: 'canceled', labelKey: 'filter.statusTypes.canceled' },
];

const statusTypeOptions = (t: TranslateFn): ColumnOption[] =>
   STATUS_TYPES.map((item) => ({
      value: item.id,
      label: t(item.labelKey),
      icon: <CircleDashed className="size-4 text-muted-foreground" />,
   }));

const assigneeOptions = (t: TranslateFn): ColumnOption[] => [
   {
      value: 'unassigned',
      label: t('filter.columns.unassigned'),
      icon: <CircleUserRound className="size-4 text-muted-foreground" />,
   },
   ...users.map((user) => ({
      value: user.id,
      label: user.name,
      icon: (
         <Avatar className="size-4">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
         </Avatar>
      ),
   })),
];

const priorityOptions: ColumnOption[] = priorities.map((priority) => ({
   value: priority.id,
   label: priority.name,
   icon: <priority.icon className="size-4 text-muted-foreground" />,
}));

const labelOptions: ColumnOption[] = labels.map((label) => ({
   value: label.id,
   label: label.name,
   icon: <span className="size-2.5 rounded-full" style={{ backgroundColor: label.color }} />,
}));

const buildProjectOptions = (projects: LeanProjectAgg[]): ColumnOption[] =>
   projects.map((project) => {
      const Icon = iconByIndex(project.iconIndex);
      return {
         value: project.id,
         label: project.name,
         icon: <Icon className="size-4 text-muted-foreground" />,
      };
   });

const cycleOptions = (t: TranslateFn): ColumnOption[] => [
   {
      value: 'no-cycle',
      label: t('filter.columns.noCycle'),
      icon: <RefreshCcw className="size-4 text-muted-foreground" />,
   },
   ...cycles.map((cycle) => ({
      value: cycle.id,
      label: `${cycle.name} (${cycleStatusLabel[cycle.status]})`,
      icon: <RefreshCcw className="size-4 text-muted-foreground" />,
   })),
];

/* -------------------------------------------------------------------------- */
/*                              Column definitions                            */
/* -------------------------------------------------------------------------- */

const dtf = createColumnConfigHelper<Issue>();

const buildIssueFilterColumns = (t: TranslateFn, projects: LeanProjectAgg[]) =>
   [
      dtf
         .option()
         .id('status')
         .accessor((issue: Issue) => issue.status.id)
         .displayName(t('filter.columns.status'))
         .icon(CircleCheck)
         .options(statusOptions)
         .build(),
      dtf
         .option()
         .id('statusType')
         .accessor((issue: Issue) => issue.status.category)
         .displayName(t('filter.columns.statusType'))
         .icon(CircleDashed)
         .options(statusTypeOptions(t))
         .build(),
      dtf
         .option()
         .id('assignee')
         .accessor((issue: Issue) => issue.assignee?.id ?? 'unassigned')
         .displayName(t('filter.columns.assignee'))
         .icon(CircleUserRound)
         .options(assigneeOptions(t))
         .build(),
      dtf
         .option()
         .id('priority')
         .accessor((issue: Issue) => issue.priority.id)
         .displayName(t('filter.columns.priority'))
         .icon(BarChart3)
         .options(priorityOptions)
         .build(),
      dtf
         .multiOption()
         .id('labels')
         .accessor((issue: Issue) => issue.labels.map((label) => label.id))
         .displayName(t('filter.columns.labels'))
         .icon(Tag)
         .options(labelOptions)
         .build(),
      dtf
         .option()
         .id('project')
         .accessor((issue: Issue) => issue.project?.id ?? '')
         .displayName(t('filter.columns.project'))
         .icon(Folder)
         .options(buildProjectOptions(projects))
         .build(),
      dtf
         .option()
         .id('cycle')
         .accessor((issue: Issue) => (issue.cycleId === '' ? 'no-cycle' : issue.cycleId))
         .displayName(t('filter.columns.cycle'))
         .icon(RefreshCcw)
         .options(cycleOptions(t))
         .build(),
   ] as const;

/**
 * Translated column config for the filter UI (display names + option labels).
 * `projects` supplies the live project options (from the hydrated store).
 */
export const getIssueFilterColumns = (t: TranslateFn, projects: LeanProjectAgg[]) =>
   buildIssueFilterColumns(t, projects);

/** Non-translated config used by `applyIssueFilters` (accessors only). */
export const issueFilterColumns = buildIssueFilterColumns((key) => key, []);

const columnById = new Map<string, (typeof issueFilterColumns)[number]>(
   issueFilterColumns.map((column) => [column.id, column])
);

/**
 * Applies a bazza/ui FiltersState to a list of issues, honoring the
 * operator of each filter (is / is not / include / exclude / …).
 */
export function applyIssueFilters(issues: Issue[], filters: FiltersState): Issue[] {
   if (filters.length === 0) return issues;

   return issues.filter((issue) =>
      filters.every((filter) => {
         const column = columnById.get(filter.columnId);
         if (!column) return true;

         const value = column.accessor(issue);
         switch (filter.type) {
            case 'option':
               return optionFilterFn(String(value ?? ''), filter) ?? true;
            case 'multiOption':
               return multiOptionFilterFn((value as string[]) ?? [], filter) ?? true;
            default:
               return true;
         }
      })
   );
}
