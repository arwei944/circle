import { create } from 'zustand';
import {
   createProjectUpdate as apiCreateUpdate,
   deleteProjectUpdate as apiDeleteUpdate,
} from '@/lib/api-projects';
import { notifyError } from '@/lib/toast';
import type { LeanProjectUpdate } from '@/lib/dto';
import { ProjectUpdate, ProjectUpdateHealth } from '@/mock-data/project-details';
import { users } from '@/mock-data/users';

interface ProjectUpdatesState {
   /** Legacy runtime updates, newest first, keyed by project id. */
   postedUpdates: Record<string, ProjectUpdate[]>;
   postUpdate: (projectId: string, health: ProjectUpdateHealth, text: string) => void;

   /** Real persisted updates, newest first, keyed by project id. */
   updatesByProject: Record<string, LeanProjectUpdate[]>;
   hydrateForProject: (projectId: string, updates: LeanProjectUpdate[]) => void;
   create: (projectId: string, input: { message: string; health?: string }) => Promise<void>;
   remove: (projectId: string, updateId: string) => Promise<void>;
}

let nextId = 1;

/**
 * Runtime project updates (the "Post update" composer) + real persisted
 * `project_updates`. The legacy `postUpdate` stays for the existing Activity
 * composer and mirrors its optimistic update into both keys; only the new
 * `create` action writes to the real API.
 */
export const useProjectUpdatesStore = create<ProjectUpdatesState>((set, get) => ({
   postedUpdates: {},
   postUpdate: (projectId, health, text) =>
      set((state) => {
         const id = `posted-${nextId++}`;
         const update: ProjectUpdate = {
            id,
            author: users[0],
            date: new Date().toISOString().slice(0, 10),
            health,
            blocks: text
               .split(/\n{2,}/)
               .filter((paragraph) => paragraph.trim() !== '')
               .map((paragraph) => ({ type: 'paragraph', text: paragraph.trim() })),
         };
         const lean: LeanProjectUpdate = {
            id,
            projectId,
            message: text,
            health,
            authorId: null,
            createdAt: Date.now(),
         };
         return {
            postedUpdates: {
               ...state.postedUpdates,
               [projectId]: [update, ...(state.postedUpdates[projectId] ?? [])],
            },
            updatesByProject: {
               ...state.updatesByProject,
               [projectId]: [lean, ...(state.updatesByProject[projectId] ?? [])],
            },
         };
      }),

   updatesByProject: {},
   hydrateForProject: (projectId, updates) =>
      set((state) => ({
         updatesByProject: { ...state.updatesByProject, [projectId]: updates },
      })),
   create: async (projectId, input) => {
      const previous = get().updatesByProject[projectId] ?? [];
      try {
         const server = (await apiCreateUpdate(projectId, {
            message: input.message,
            health: input.health ?? 'no-update',
         })) as LeanProjectUpdate;
         set((state) => ({
            updatesByProject: {
               ...state.updatesByProject,
               [projectId]: [server, ...(state.updatesByProject[projectId] ?? [])],
            },
         }));
      } catch (e) {
         set((state) => ({
            updatesByProject: { ...state.updatesByProject, [projectId]: previous },
         }));
         notifyError((e as Error).message);
      }
   },
   remove: async (projectId, updateId) => {
      const previous = get().updatesByProject[projectId] ?? [];
      set((state) => ({
         updatesByProject: {
            ...state.updatesByProject,
            [projectId]: (state.updatesByProject[projectId] ?? []).filter((u) => u.id !== updateId),
         },
      }));
      try {
         await apiDeleteUpdate(projectId, updateId);
      } catch (e) {
         set((state) => ({
            updatesByProject: { ...state.updatesByProject, [projectId]: previous },
         }));
         notifyError((e as Error).message);
      }
   },
}));
