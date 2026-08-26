import { format, parseISO } from 'date-fns';

export type CycleStatus = 'planned' | 'upcoming' | 'current' | 'completed';

export const CYCLE_STATUSES: CycleStatus[] = ['planned', 'upcoming', 'current', 'completed'];

/** Maps a cycle status to its i18n key under the `cycles` namespace. */
export const cycleStatusLabel: Record<CycleStatus, string> = {
   planned: 'status.planned',
   upcoming: 'status.upcoming',
   current: 'status.current',
   completed: 'status.completed',
};

export function formatCycleDateRange(cycle: { startDate: string; endDate: string }): string {
   return `${format(parseISO(cycle.startDate), 'MMM d')} → ${format(parseISO(cycle.endDate), 'MMM d')}`;
}
