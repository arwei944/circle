import { status as statuses } from '@/mock-data/status';
import { priorities } from '@/mock-data/priorities';
import { health } from '@/mock-data/projects';
import { iconByIndex } from '@/lib/project-icons';
import type { Issue } from '@/mock-data/issues';
import type { Project } from '@/mock-data/projects';
import type { User } from '@/mock-data/users';
import type { Status } from '@/mock-data/status';
import type { Priority } from '@/mock-data/priorities';
import type { LeanIssue, LeanProject, LeanUser } from '@/lib/dto';

export interface Meta {
   users: LeanUser[];
   projects: LeanProject[];
}

const statusById = (id: string): Status => statuses.find((s) => s.id === id) ?? statuses[0];
const priorityById = (id: string): Priority => priorities.find((p) => p.id === id) ?? priorities[0];
const healthById = (id: string) => health.find((h) => h.id === id) ?? health[0];

export function dtoToIssue(lean: LeanIssue, meta: Meta): Issue {
   const proj = meta.projects.find((p) => p.id === lean.projectId);
   const asg = lean.assignee;
   return {
      id: lean.id,
      identifier: lean.identifier,
      title: lean.title,
      description: lean.description ?? '',
      status: statusById(lean.statusId),
      assignee: asg
         ? {
              id: asg.id,
              name: asg.name,
              email: asg.email,
              avatarUrl: asg.avatarUrl,
              timezone: asg.timezone,
              status: asg.status as User['status'],
              role: asg.role as User['role'],
              joinedDate: asg.joinedDate,
              teamIds: asg.teamIds,
           }
         : null,
      priority: priorityById(lean.priorityId),
      labels: (lean.labels ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
      createdAt: lean.createdAt,
      cycleId: lean.cycleId ?? '',
      project: proj
         ? {
              id: proj.id,
              name: proj.name,
              icon: iconByIndex(proj.iconIndex),
              teamId: proj.teamId,
              startDate: proj.startDate ?? '',
              targetDate: proj.targetDate ?? '',
              percentComplete: proj.percentComplete,
              status: statusById('to-do'),
              priority: priorityById('no-priority'),
              health: healthById('no-update'),
              lead: {} as User,
              labels: [],
           }
         : undefined,
      rank: lean.rank,
      dueDate: (lean.dueDate as string | undefined) ?? undefined,
      subissues: lean.subissues ?? [],
   };
}
