import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectsStore } from '@/store/projects-store';
import type { LeanProjectAgg } from '@/lib/dto';

const realApi = await import('@/lib/api-projects');

vi.mock('@/lib/api-projects', async () => {
   const actual = await vi.importActual<typeof import('@/lib/api-projects')>('@/lib/api-projects');
   return { ...actual };
});
vi.mock('@/lib/toast', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));

beforeEach(() => {
   useProjectsStore.setState({ projects: [], hydrated: false });
   vi.clearAllMocks();
});

const mkProject = (id: string, override: Partial<LeanProjectAgg> = {}): LeanProjectAgg => ({
   id,
   name: `project ${id}`,
   iconIndex: 0,
   color: '#8f9299',
   statusId: 'to-do',
   health: 'no-update',
   priority: 'no-priority',
   leadId: null,
   teamId: 'CORE',
   startDate: '2026-01-01',
   targetDate: null,
   percentComplete: 0,
   initiative: null,
   labels: [],
   totalIssues: 0,
   completedIssues: 0,
   healthUpdatedAgoDays: null,
   lead: null,
   ...override,
});

describe('hydrate', () => {
   it('sets hydrated and stores the projects', () => {
      const a = mkProject('p1');
      const b = mkProject('p2');
      useProjectsStore.getState().hydrate([a, b]);
      const s = useProjectsStore.getState();
      expect(s.hydrated).toBe(true);
      expect(s.projects).toHaveLength(2);
   });
});

describe('createProject', () => {
   it('appends the server-returned project on success', async () => {
      const a = mkProject('p1');
      useProjectsStore.getState().hydrate([a]);
      const server = mkProject('proj_new', { name: 'New Project' });
      vi.spyOn(realApi, 'createProject').mockResolvedValueOnce(server as never);
      await useProjectsStore.getState().createProject({ name: 'New Project' });
      const s = useProjectsStore.getState();
      expect(s.projects.some((p) => p.id === 'proj_new')).toBe(true);
      expect(s.hydrated).toBe(true);
   });

   it('rolls back and notifies on failure', async () => {
      const a = mkProject('p1');
      useProjectsStore.getState().hydrate([a]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'createProject').mockRejectedValueOnce(new Error('boom'));
      await useProjectsStore.getState().createProject({ name: 'x' });
      const s = useProjectsStore.getState();
      expect(s.projects).toHaveLength(1);
      expect(s.projects[0].id).toBe('p1');
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});

describe('updateProject optimistic', () => {
   it('applies patch locally then replaces with server DTO', async () => {
      const a = mkProject('p1');
      useProjectsStore.getState().hydrate([a]);
      const server = mkProject('p1', { name: 'Renamed-v2' });
      vi.spyOn(realApi, 'updateProject').mockResolvedValueOnce(server as never);
      const promise = useProjectsStore.getState().updateProject('p1', { name: 'Renamed' });
      expect(useProjectsStore.getState().projects[0].name).toBe('Renamed');
      await promise;
      expect(useProjectsStore.getState().projects[0].name).toBe('Renamed-v2');
   });

   it('rolls back and notifies on failure', async () => {
      const a = mkProject('p1');
      useProjectsStore.getState().hydrate([a]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'updateProject').mockRejectedValueOnce(new Error('boom'));
      await useProjectsStore.getState().updateProject('p1', { name: 'Renamed' });
      const s = useProjectsStore.getState();
      expect(s.projects[0].name).toBe('project p1');
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});

describe('deleteProject optimistic', () => {
   it('removes locally when the API call succeeds', async () => {
      const a = mkProject('p1');
      const b = mkProject('p2');
      useProjectsStore.getState().hydrate([a, b]);
      vi.spyOn(realApi, 'deleteProject').mockResolvedValueOnce();
      await useProjectsStore.getState().deleteProject('p1');
      const s = useProjectsStore.getState();
      expect(s.projects.some((p) => p.id === 'p1')).toBe(false);
      expect(s.projects).toHaveLength(1);
   });

   it('restores the removed project on failure and notifies', async () => {
      const a = mkProject('p1');
      const b = mkProject('p2');
      useProjectsStore.getState().hydrate([a, b]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'deleteProject').mockRejectedValueOnce(new Error('boom'));
      await useProjectsStore.getState().deleteProject('p1');
      const s = useProjectsStore.getState();
      expect(s.projects).toHaveLength(2);
      expect(s.projects.some((p) => p.id === 'p1')).toBe(true);
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});
