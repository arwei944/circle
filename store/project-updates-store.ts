import { create } from 'zustand';
import {
   createProjectUpdate as apiCreateUpdate,
   deleteProjectUpdate as apiDeleteUpdate,
} from '@/lib/api-projects';
import { notifyError } from '@/lib/toast';
import type { LeanProjectUpdate } from '@/lib/dto';

interface ProjectUpdatesState {
   /** Real persisted updates, newest first, keyed by project id. */
   updatesByProject: Record<string, LeanProjectUpdate[]>;
   hydrateForProject: (projectId: string, updates: LeanProjectUpdate[]) => void;
   create: (projectId: string, input: { message: string; health?: string }) => Promise<void>;
   remove: (projectId: string, updateId: string) => Promise<void>;
}

/**
 * Real persisted `project_updates`, keyed by project id. `updatesByProject` is
 * written exclusively by `hydrateForProject` / `create` (server-backed data).
 */
export const useProjectUpdatesStore = create<ProjectUpdatesState>((set, get) => ({
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
