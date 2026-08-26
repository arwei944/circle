'use client';

import { DataTableFilter } from '@/components/data-table-filter';
import { useDataTableFilters } from '@/components/data-table-filter/hooks/use-data-table-filters';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useFilterStore } from '@/store/filter-store';
import { useIssuesStore } from '@/store/issues-store';
import { useProjectsStore } from '@/store/projects-store';
import { useCyclesStore } from '@/store/cycles-store';
import { getIssueFilterColumns } from './issue-filter-columns';

/**
 * Linear-style applied-filters row: filter chips (subject / operator /
 * values / remove), an icon button to add more filters and a Clear action,
 * powered by bazza/ui's data-table-filter. Filter state lives in the URL
 * (see filter-store).
 *
 * The row only appears once at least one filter is active — the entry
 * point "Filter" button lives in the header toolbar (see
 * <IssueFilterTrigger/>), like Linear.
 */
export function IssueFilterBar() {
   const { issues } = useIssuesStore();
   const projects = useProjectsStore((s) => s.projects);
   const cycles = useCyclesStore((s) => s.cycles);
   const { filters, setFilters } = useFilterStore();
   const t = useTranslations('issues');
   const tCycles = useTranslations('cycles');
   const columnsConfig = useMemo(
      () => getIssueFilterColumns(t, tCycles, projects, cycles),
      [t, tCycles, projects, cycles]
   );

   const { columns, actions, strategy } = useDataTableFilters({
      strategy: 'client',
      data: issues,
      columnsConfig,
      filters,
      onFiltersChange: setFilters,
   });

   if (filters.length === 0) return null;

   return (
      <div className="w-full px-6 py-2 border-b border-border/60 bg-container">
         <DataTableFilter
            columns={columns}
            filters={filters}
            actions={actions}
            strategy={strategy}
         />
      </div>
   );
}
