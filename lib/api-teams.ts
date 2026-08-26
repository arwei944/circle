import { getJson } from '@/lib/api-client';

export const fetchTeam = async (teamId: string) =>
   getJson<{ team: unknown; projects: unknown[]; cycles: unknown[] }>(`/api/teams/${teamId}`);
