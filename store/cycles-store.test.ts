import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCyclesStore } from '@/store/cycles-store';
import type { LeanCycle } from '@/lib/dto';

const realApi = await import('@/lib/api-cycles');

vi.mock('@/lib/api-cycles', async () => {
   const actual = await vi.importActual<typeof import('@/lib/api-cycles')>('@/lib/api-cycles');
   return { ...actual };
});
vi.mock('@/lib/toast', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));

beforeEach(() => {
   useCyclesStore.setState({ cycles: [], hydrated: false });
   vi.clearAllMocks();
});

const mkCycle = (id: string, override: Partial<LeanCycle> = {}): LeanCycle => ({
   id,
   name: `cycle ${id}`,
   teamId: 'CORE',
   status: 'planned',
   startDate: '2026-08-03',
   endDate: '2026-08-16',
   capacity: 0,
   scope: 0,
   started: 0,
   completed: 0,
   ...override,
});

describe('hydrate', () => {
   it('sets hydrated and stores the cycles', () => {
      const a = mkCycle('c1');
      const b = mkCycle('c2');
      useCyclesStore.getState().hydrate([a, b]);
      const s = useCyclesStore.getState();
      expect(s.hydrated).toBe(true);
      expect(s.cycles).toHaveLength(2);
   });
});

describe('createCycle', () => {
   it('inserts the server-returned cycle in startDate order and resolves true', async () => {
      const a = mkCycle('c1', { startDate: '2026-08-03' });
      useCyclesStore.getState().hydrate([a]);
      const server = mkCycle('cyc_new', {
         name: 'New Cycle',
         status: 'current',
         startDate: '2026-07-01',
      });
      vi.spyOn(realApi, 'createCycle').mockResolvedValueOnce(server as never);
      const ok = await useCyclesStore.getState().createCycle({ name: 'New Cycle' });
      const s = useCyclesStore.getState();
      expect(ok).toBe(true);
      expect(s.cycles.map((c) => c.id)).toEqual(['cyc_new', 'c1']);
      expect(s.hydrated).toBe(true);
   });

   it('resolves false and notifies on failure without changing the list', async () => {
      const a = mkCycle('c1');
      useCyclesStore.getState().hydrate([a]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'createCycle').mockRejectedValueOnce(new Error('boom'));
      const ok = await useCyclesStore.getState().createCycle({ name: 'x' });
      const s = useCyclesStore.getState();
      expect(ok).toBe(false);
      expect(s.cycles).toHaveLength(1);
      expect(s.cycles[0].id).toBe('c1');
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});

describe('updateCycle optimistic', () => {
   it('applies patch locally then replaces with server DTO and resolves true', async () => {
      const a = mkCycle('c1');
      useCyclesStore.getState().hydrate([a]);
      const server = mkCycle('c1', { name: 'Renamed-v2', status: 'completed' });
      vi.spyOn(realApi, 'updateCycle').mockResolvedValueOnce(server as never);
      const promise = useCyclesStore.getState().updateCycle('c1', { name: 'Renamed' });
      expect(useCyclesStore.getState().cycles[0].name).toBe('Renamed');
      const ok = await promise;
      expect(ok).toBe(true);
      const s = useCyclesStore.getState();
      expect(s.cycles[0].name).toBe('Renamed-v2');
      expect(s.cycles[0].status).toBe('completed');
   });

   it('resolves false and notifies on failure', async () => {
      const a = mkCycle('c1');
      useCyclesStore.getState().hydrate([a]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'updateCycle').mockRejectedValueOnce(new Error('boom'));
      const ok = await useCyclesStore.getState().updateCycle('c1', { name: 'Renamed' });
      const s = useCyclesStore.getState();
      expect(ok).toBe(false);
      expect(notifyError).toHaveBeenCalledWith('boom');
      expect(s.cycles).toHaveLength(1);
      expect(s.cycles[0].id).toBe('c1');
      expect(s.cycles[0].name).toBe('cycle c1');
   });
});

describe('deleteCycle optimistic', () => {
   it('removes locally when the API call succeeds and resolves true', async () => {
      const a = mkCycle('c1');
      const b = mkCycle('c2');
      useCyclesStore.getState().hydrate([a, b]);
      vi.spyOn(realApi, 'deleteCycle').mockResolvedValueOnce();
      const ok = await useCyclesStore.getState().deleteCycle('c1');
      const s = useCyclesStore.getState();
      expect(ok).toBe(true);
      expect(s.cycles.some((c) => c.id === 'c1')).toBe(false);
      expect(s.cycles).toHaveLength(1);
   });

   it('resolves false and notifies on API failure', async () => {
      const a = mkCycle('c1');
      const b = mkCycle('c2');
      useCyclesStore.getState().hydrate([a, b]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'deleteCycle').mockRejectedValueOnce(new Error('boom'));
      const ok = await useCyclesStore.getState().deleteCycle('c1');
      const s = useCyclesStore.getState();
      expect(ok).toBe(false);
      expect(notifyError).toHaveBeenCalledWith('boom');
      expect(s.cycles.some((c) => c.id === 'c1')).toBe(true);
      expect(s.cycles).toHaveLength(2);
   });
});
