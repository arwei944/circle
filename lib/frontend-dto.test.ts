import { describe, expect, it } from 'vitest';
import { dtoToIssue, type Meta } from './frontend-dto';

const meta: Meta = {
   users: [],
   projects: [
      {
         id: 'p1',
         name: '项目1',
         iconIndex: 0,
         color: '#fff',
         teamId: 'CORE',
         startDate: null,
         targetDate: null,
         percentComplete: 50,
      },
   ],
};

it('enriches status, priority and project icon; keeps null assignee', () => {
   const issue = dtoToIssue(
      {
         id: 'a',
         identifier: 'P-001',
         title: 't',
         description: '',
         statusId: 'in-progress',
         priorityId: 'high',
         assigneeId: null,
         projectId: 'p1',
         cycleId: '',
         createdAt: '2026-01-01',
         rank: 'a3c',
         subissues: [],
         labels: [],
         assignee: null,
         project: meta.projects[0],
      },
      meta
   );
   expect(issue.status.id).toBe('in-progress');
   expect(issue.priority.id).toBe('high');
   expect(issue.project?.icon).toBeTypeOf('object');
   expect(issue.assignee).toBeNull();
});
