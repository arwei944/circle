import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIssuesStore, setStoreMeta } from '@/store/issues-store';
import { type Issue } from '@/mock-data/issues';
import { status } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';
import type { LeanIssue } from '@/lib/dto';
import type { Meta } from '@/lib/frontend-dto';

const realApi = await import('@/lib/api-issues');

vi.mock('@/lib/api-issues', async () => {
   const actual = await vi.importActual<typeof import('@/lib/api-issues')>('@/lib/api-issues');
   return { ...actual };
});
vi.mock('@/lib/toast', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }));

beforeEach(() => {
   useIssuesStore.setState({ issues: [], issuesByStatus: {}, hydrated: false });
   setStoreMeta({ users: [], projects: [] });
   vi.clearAllMocks();
});

const mkIssue = (id: string, override: Partial<Issue> = {}): Issue => ({
   id,
   identifier: id.toUpperCase(),
   title: `issue ${id}`,
   description: '',
   status: status[5],
   assignee: null,
   priority: priorities[0],
   labels: [],
   createdAt: '2026-01-01',
   cycleId: '',
   rank: 'a' + id,
   ...override,
});

describe('hydrate', () => {
   it('hydrates issues and builds issuesByStatus', () => {
      const a = mkIssue('i1');
      const b = mkIssue('i2');
      useIssuesStore.getState().hydrate([a, b]);
      const s = useIssuesStore.getState();
      expect(s.hydrated).toBe(true);
      expect(s.issues).toHaveLength(2);
      expect(s.issuesByStatus['backlog']).toHaveLength(2);
   });
});

describe('updateIssueStatus optimistic', () => {
   it('applies locally then persists; rolls back on failure', async () => {
      const a = mkIssue('i1');
      const b = mkIssue('i2');
      useIssuesStore.getState().hydrate([a, b]);
      const updateSpy = vi.spyOn(realApi, 'updateIssue').mockResolvedValueOnce({ ...a });
      await useIssuesStore.getState().updateIssueStatus('i1', status[0]);
      expect(useIssuesStore.getState().issues[0].status.id).toBe('in-progress');
      expect(updateSpy).toHaveBeenCalledTimes(1);

      updateSpy.mockRejectedValueOnce(new Error('boom'));
      await useIssuesStore.getState().updateIssueStatus('i1', status[1]);
      // 回滚到用户可用的最后状态
      expect(useIssuesStore.getState().issues[0].status.id).toBe('in-progress');
   });

   it('status-only update does not send assignee/dueDate in patch', async () => {
      const a = mkIssue('i1');
      useIssuesStore.getState().hydrate([a]);
      const updateSpy = vi.spyOn(realApi, 'updateIssue').mockResolvedValueOnce({ ...a });
      await useIssuesStore.getState().updateIssueStatus('i1', status[0]);
      const patch = updateSpy.mock.calls[0][1] as Record<string, unknown>;
      expect(patch.statusId).toBe('in-progress');
      expect('assigneeId' in patch).toBe(false);
      expect('dueDate' in patch).toBe(false);
   });
});

describe('addIssue optimistic replace', () => {
   it('inserts temp issue then replaces with server DTO', async () => {
      const a = mkIssue('i1');
      useIssuesStore.getState().hydrate([a]);
      const server = { ...mkIssue('temp_tmp'), id: 'iss_', identifier: 'P-001', rank: 'zzz' };
      vi.spyOn(realApi, 'createIssue').mockResolvedValueOnce(server);
      await useIssuesStore
         .getState()
         .addIssue({ ...mkIssue('temp_tmp'), identifier: 'P-000', rank: 'zzz' });
      const s = useIssuesStore.getState();
      expect(s.issues.some((i) => i.id === 'temp_tmp')).toBe(false);
      expect(s.issues.some((i) => i.id === 'iss_')).toBe(true);
      expect(s.issues[0].identifier).toBe('P-001');
   });

   it('enriches a lean server DTO returned by createIssue', async () => {
      const a = mkIssue('i1');
      useIssuesStore.getState().hydrate([a]);
      const meta: Meta = {
         users: [],
         projects: [
            {
               id: 'p1',
               name: 'LNDev UI - 核心组件',
               iconIndex: 0,
               color: '#000',
               teamId: 'CORE',
               startDate: '2026-01-01',
               targetDate: '2026-02-01',
               percentComplete: 0,
            },
         ],
      };
      setStoreMeta(meta);
      const leanServer: LeanIssue = {
         id: 'iss_lean',
         identifier: 'P-042',
         title: 'issue temp_tmp',
         description: '',
         statusId: 'in-progress',
         priorityId: 'high',
         assigneeId: null,
         projectId: 'p1',
         cycleId: '',
         createdAt: '2026-08-26',
         dueDate: null,
         rank: 'zzz',
         subissues: [],
         labels: [],
         assignee: null,
         project: {
            id: 'p1',
            name: 'LNDev UI - 核心组件',
            iconIndex: 0,
            color: '#000',
            teamId: 'CORE',
            startDate: '2026-01-01',
            targetDate: '2026-02-01',
            percentComplete: 0,
         },
      };
      vi.spyOn(realApi, 'createIssue').mockResolvedValueOnce(leanServer);
      await useIssuesStore.getState().addIssue(mkIssue('temp_tmp'));
      const s = useIssuesStore.getState();
      const row = s.issues.find((i) => i.id === 'iss_lean');
      expect(s.issues.some((i) => i.id === 'temp_tmp')).toBe(false);
      expect(row).toBeDefined();
      expect(row!.status.id).toBe('in-progress');
      expect(row!.priority.id).toBe('high');
      expect(row!.identifier).toBe('P-042');
      expect(row!.project?.name).toBe('LNDev UI - 核心组件');
   });

   it('rolls back and notifies on create failure', async () => {
      const a = mkIssue('i1');
      useIssuesStore.getState().hydrate([a]);
      const { notifyError } = await import('@/lib/toast');
      vi.spyOn(realApi, 'createIssue').mockRejectedValueOnce(new Error('boom'));
      await useIssuesStore
         .getState()
         .addIssue({ ...mkIssue('temp_tmp'), identifier: 'P-000', rank: 'zzz' });
      const s = useIssuesStore.getState();
      expect(s.issues.some((i) => i.id === 'temp_tmp')).toBe(false);
      expect(s.issues.some((i) => i.id === 'i1')).toBe(true);
      expect(notifyError).toHaveBeenCalledWith('boom');
   });
});
