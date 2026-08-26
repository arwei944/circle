import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectUpdatesStore } from '@/store/project-updates-store';
import type { LeanProjectUpdate } from '@/lib/dto';

const realApi = await import('@/lib/api-projects');

vi.mock('@/lib/api-projects', async () => {
   const actual = await vi.importActual<typeof import('@/lib/api-projects')>('@/lib/api-projects');
   return { ...actual };
});
vi.mock('@/lib/toast', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));

beforeEach(() => {
   useProjectUpdatesStore.setState({ updatesByProject: {}, postedUpdates: {} });
   vi.clearAllMocks();
});

const mkLeanUpdate = (
   id: string,
   override: Partial<LeanProjectUpdate> = {}
): LeanProjectUpdate => ({
   id,
   projectId: 'proj_1',
   message: `update ${id}`,
   health: 'on-track',
   authorId: null,
   createdAt: 1785000000000,
   ...override,
});

describe('create project update', () => {
   it('prepends the server-returned update on success', async () => {
      const server = mkLeanUpdate('pu_new', { health: 'at-risk' });
      vi.spyOn(realApi, 'createProjectUpdate').mockResolvedValueOnce(server as never);
      await useProjectUpdatesStore.getState().create('proj_1', {
         message: 'update pu_new',
         health: 'at-risk',
      });
      const s = useProjectUpdatesStore.getState();
      expect(s.updatesByProject['proj_1']).toHaveLength(1);
      expect(s.updatesByProject['proj_1'][0].id).toBe('pu_new');
      expect(s.updatesByProject['proj_1'][0].health).toBe('at-risk');
   });

   it('rolls back and notifies on failure', async () => {
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'createProjectUpdate').mockRejectedValueOnce(new Error('boom'));
      await useProjectUpdatesStore.getState().create('proj_1', {
         message: 'update pu_new',
         health: 'on-track',
      });
      const s = useProjectUpdatesStore.getState();
      expect(s.updatesByProject['proj_1'] ?? []).toHaveLength(0);
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});

describe('remove project update', () => {
   it('removes the update locally when the API call succeeds', async () => {
      useProjectUpdatesStore
         .getState()
         .hydrateForProject('proj_1', [mkLeanUpdate('u1'), mkLeanUpdate('u2')]);
      vi.spyOn(realApi, 'deleteProjectUpdate').mockResolvedValueOnce();
      await useProjectUpdatesStore.getState().remove('proj_1', 'u1');
      const s = useProjectUpdatesStore.getState();
      expect(s.updatesByProject['proj_1'].map((u) => u.id)).toEqual(['u2']);
   });

   it('restores the removed update on failure and notifies', async () => {
      const { notifyError } = await import('@/lib/toast');
      useProjectUpdatesStore
         .getState()
         .hydrateForProject('proj_1', [mkLeanUpdate('u1'), mkLeanUpdate('u2')]);
      vi.spyOn(realApi, 'deleteProjectUpdate').mockRejectedValueOnce(new Error('boom'));
      await useProjectUpdatesStore.getState().remove('proj_1', 'u1');
      const s = useProjectUpdatesStore.getState();
      expect(s.updatesByProject['proj_1'].map((u) => u.id)).toEqual(['u1', 'u2']);
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});
