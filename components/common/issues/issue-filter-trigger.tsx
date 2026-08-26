'use client';

import { FilterSelector } from '@/components/data-table-filter/components/filter-selector';
import { useDataTableFilters } from '@/components/data-table-filter/hooks/use-data-table-filters';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useFilterStore } from '@/store/filter-store';
import { useIssuesStore } from '@/store/issues-store';
import { useProjectsStore } from '@/store/projects-store';
import { useCyclesStore } from '@/store/cycles-store';
import { getIssueFilterColumns } from './issue-filter-columns';

/**
 * Standalone "Filter" button for the header toolbars, on the same row as
 * the issue count / Display options (Linear-style). The applied filter
 * chips live in <IssueFilterBar/>, which only shows up once at least one
 * filter is active.
 */
export function IssueFilterTrigger() {
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

   return (
      <FilterSelector columns={columns} filters={filters} actions={actions} strategy={strategy} />
   );
}
