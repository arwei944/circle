import type { LeanProjectAgg, LeanUser } from '@/lib/dto';
import { iconByIndex } from '@/lib/project-icons';
import { health, type Health, type Project } from '@/mock-data/projects';
import { priorities, type Priority } from '@/mock-data/priorities';
import { status, type Status } from '@/mock-data/status';
import type { User } from '@/mock-data/users';

/** Placeholder used when a real project has no lead set. */
const NO_LEAD: User = {
   id: '',
   name: '—',
   avatarUrl: '',
   email: '',
   timezone: 'UTC',
   status: 'offline',
   role: 'Member',
   joinedDate: '',
   teamIds: [],
};

const toUser = (lean: LeanUser): User => ({
   id: lean.id,
   name: lean.name,
   email: lean.email,
   avatarUrl: lean.avatarUrl,
   timezone: lean.timezone,
   status: lean.status as User['status'],
   role: lean.role as User['role'],
   joinedDate: lean.joinedDate,
   teamIds: lean.teamIds,
});

const statusOf = (lean: LeanProjectAgg): Status =>
   status.find((s) => s.id === (lean.statusId ?? 'to-do')) ?? status[0];

const priorityOf = (lean: LeanProjectAgg): Priority =>
   priorities.find((p) => p.id === (lean.priority ?? 'no-priority')) ?? priorities[0];

const healthOf = (lean: LeanProjectAgg): Health =>
   health.find((h) => h.id === (lean.health ?? 'no-update')) ?? health[0];

const leadOf = (lean: LeanProjectAgg): User => (lean.lead ? toUser(lean.lead) : NO_LEAD);

/**
 * Maps a `LeanProjectAgg` (server DTO) onto the mock `Project` view-model
 * shared by the projects UI. The DTO stores scalar ids (statusId/priority/
 * health/iconIndex) that the components render as objects/icons.
 */
export function toProjectViewModel(lean: LeanProjectAgg): Project {
   const project: Project = {
      id: lean.id,
      name: lean.name,
      status: statusOf(lean),
      icon: iconByIndex(lean.iconIndex),
      percentComplete: lean.percentComplete,
      startDate: lean.startDate ?? '',
      lead: leadOf(lean),
      priority: priorityOf(lean),
      health: healthOf(lean),
      teamId: lean.teamId,
      labels: (lean.labels ?? []).map((label) =>
         typeof label === 'string'
            ? { id: label, name: label, color: '#8f9299' }
            : { id: label.id, name: label.name, color: label.color }
      ),
   };
   if (lean.targetDate) project.targetDate = lean.targetDate;
   if (lean.initiative) project.initiative = lean.initiative;
   if (lean.healthUpdatedAgoDays != null) project.healthUpdatedAgoDays = lean.healthUpdatedAgoDays;
   return project;
}

export const toProjectViewModels = (leans: LeanProjectAgg[]): Project[] =>
   leans.map(toProjectViewModel);
