import { getJson, sendJson } from '@/lib/api-client';

export const fetchCycles = async () => (await getJson<{ cycles: unknown[] }>('/api/cycles')).cycles;
export const createCycle = async (input: Record<string, unknown>) =>
   (await sendJson<{ cycle: unknown }>('POST', '/api/cycles', input)).cycle;
export const updateCycle = async (id: string, patch: Record<string, unknown>) =>
   (await sendJson<{ cycle: unknown }>('PATCH', `/api/cycles/${id}`, patch)).cycle;
export const deleteCycle = async (id: string) => sendJson<void>('DELETE', `/api/cycles/${id}`);
